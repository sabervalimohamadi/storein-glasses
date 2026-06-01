import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Order, OrderDocument, OrderStatus,
  ORDER_TRANSITIONS,
} from './entities/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CartService } from '../cart/cart.service';
import { ProductService } from '../product/product.service';
import { DiscountService } from '../discount/discount.service';
import {
  EVENTS,
  OrderStatusChangedEvent,
} from '../notification/notification.listener';
import type { UserDocument } from '../user/entities/user.schema';
import { User } from '../user/entities/user.schema';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(User.name)  private userModel: Model<UserDocument>,
    private cartService: CartService,
    private productService: ProductService,
    private discountService: DiscountService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createFromCart(userId: string, dto: CreateOrderDto): Promise<OrderDocument> {
    const cart = await this.cartService.getRawCart(userId);
    if (!cart.items.length)
      throw new BadRequestException('سبد خرید خالی است');

    const user = await this.userModel
      .findById(userId)
      .select('addresses')
      .lean<UserDocument>();
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const address = user.addresses.find(
      (a) => a._id.toString() === dto.addressId,
    );
    if (!address) throw new NotFoundException('آدرس یافت نشد');

    // Full stock validation pass before any write
    for (const item of cart.items) {
      const product = await this.productService.findById(item.productId);
      const variant  = product.variants.find(
        (v) => v._id.toString() === item.variantId,
      );
      if (!variant?.isActive)
        throw new BadRequestException(`ویریانت "${item.name}" موجود نیست`);
      if (variant.stock < item.quantity)
        throw new BadRequestException(
          `موجودی "${item.name}" کافی نیست. موجود: ${variant.stock}`,
        );
    }

    const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);

    let discount   = 0;
    let couponDoc: any = null;

    if (dto.couponCode) {
      const result = await this.discountService.validate(
        userId, dto.couponCode, subtotal,
      );
      if (!result.isValid) throw new BadRequestException(result.message);
      discount  = result.discountAmount;
      couponDoc = result.coupon;
    }

    const total = subtotal - discount;

    const order = await this.orderModel.create({
      userId:  new Types.ObjectId(userId),
      orderNumber: this.genOrderNumber(),
      items: cart.items.map((i) => ({
        productId:    new Types.ObjectId(i.productId),
        variantId:    i.variantId,
        sku:          i.sku,
        name:         i.name,
        thumbnail:    i.thumbnail ?? '',
        price:        i.price,
        comparePrice: i.comparePrice ?? null,
        quantity:     i.quantity,
        attributes:   i.attributes ?? [],
      })),
      shippingAddress: {
        recipientName:  address.recipientName,
        recipientPhone: address.recipientPhone,
        province:       address.province,
        city:           address.city,
        street:         address.street,
        detail:         address.detail,
        postalCode:     address.postalCode,
      },
      subtotal,
      discount,
      total,
      couponCode: dto.couponCode,
      note:       dto.note,
    });

    for (const item of cart.items) {
      await this.productService.adjustStock(
        item.productId, item.variantId, -item.quantity,
      );
    }
    await this.cartService.clearCart(userId);

    if (couponDoc && discount > 0) {
      await this.discountService.recordUsage(
        couponDoc._id,
        userId,
        (order._id as any).toString(),
        discount,
      );
    }

    return order.toObject();
  }

  async findMyOrders(userId: string, page = 1, limit = 10) {
    const filter = { userId: new Types.ObjectId(userId) };
    const skip   = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<OrderDocument[]>(),
      this.orderModel.countDocuments(filter),
    ]);

    return { orders, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findMyOrderById(userId: string, orderId: string): Promise<OrderDocument> {
    this.assertId(orderId);
    const order = await this.orderModel
      .findOne({ _id: orderId, userId: new Types.ObjectId(userId) })
      .select('-__v')
      .lean<OrderDocument>();
    if (!order) throw new NotFoundException('سفارش یافت نشد');
    return order;
  }

  async cancelMyOrder(userId: string, orderId: string): Promise<OrderDocument> {
    this.assertId(orderId);
    const order = await this.orderModel.findOne({
      _id: orderId, userId: new Types.ObjectId(userId),
    });
    if (!order) throw new NotFoundException('سفارش یافت نشد');

    this.assertTransition(order.status, OrderStatus.CANCELLED);

    for (const item of order.items) {
      await this.productService.adjustStock(
        item.productId.toString(), item.variantId, item.quantity,
      );
    }

    const previousStatus = order.status;
    order.status         = OrderStatus.CANCELLED;
    order.cancelReason   = 'لغو توسط خریدار';
    await order.save();

    const userForEvent = await this.userModel
      .findById(order.userId).select('phone').lean<UserDocument>();
    if (userForEvent) {
      const event: OrderStatusChangedEvent = {
        orderId:        (order._id as any).toString(),
        orderNumber:    order.orderNumber,
        userId:         order.userId.toString(),
        phone:          (userForEvent as any).phone,
        status:         order.status,
        previousStatus: previousStatus,
      };
      this.eventEmitter.emit(EVENTS.ORDER_STATUS_CHANGED, event);
    }

    return order.toObject();
  }

  async adminFindAll(page = 1, limit = 20, status?: OrderStatus) {
    const filter: Record<string, any> = status ? { status } : {};
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'phone firstName lastName')
        .lean<OrderDocument[]>(),
      this.orderModel.countDocuments(filter),
    ]);

    return { orders, total, page, totalPages: Math.ceil(total / limit) };
  }

  async adminFindById(orderId: string): Promise<OrderDocument> {
    this.assertId(orderId);
    const order = await this.orderModel
      .findById(orderId)
      .select('-__v')
      .populate('userId', 'phone firstName lastName')
      .lean<OrderDocument>();
    if (!order) throw new NotFoundException('سفارش یافت نشد');
    return order;
  }

  async updateStatus(orderId: string, dto: UpdateOrderStatusDto): Promise<OrderDocument> {
    this.assertId(orderId);
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('سفارش یافت نشد');

    this.assertTransition(order.status, dto.status);

    if (dto.status === OrderStatus.CANCELLED) {
      for (const item of order.items) {
        await this.productService.adjustStock(
          item.productId.toString(), item.variantId, item.quantity,
        );
      }
      if (dto.cancelReason) order.cancelReason = dto.cancelReason;
    }

    const previousStatus = order.status;
    order.status         = dto.status;
    await order.save();

    const userForEvent = await this.userModel
      .findById(order.userId).select('phone').lean<UserDocument>();
    if (userForEvent) {
      const event: OrderStatusChangedEvent = {
        orderId:        (order._id as any).toString(),
        orderNumber:    order.orderNumber,
        userId:         order.userId.toString(),
        phone:          (userForEvent as any).phone,
        status:         order.status,
        previousStatus: previousStatus,
      };
      this.eventEmitter.emit(EVENTS.ORDER_STATUS_CHANGED, event);
    }

    return order.toObject();
  }

  private genOrderNumber(): string {
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${Date.now()}-${rand}`;
  }

  private assertId(id: string): void {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('شناسه معتبر نیست');
  }

  private assertTransition(current: OrderStatus, next: OrderStatus): void {
    if (!ORDER_TRANSITIONS[current].includes(next))
      throw new BadRequestException(
        `تغییر از "${current}" به "${next}" مجاز نیست`,
      );
  }
}
