import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './entities/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

const MAX_ADDRESSES = 10;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // ── Profile ───────────────────────────────────────────────────
  async getProfile(userId: string): Promise<UserDocument> {
    const user = await this.userModel
      .findById(userId)
      .select('-__v')
      .lean<UserDocument>();
    if (!user) throw new NotFoundException('کاربر یافت نشد');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $set: dto }, { new: true, runValidators: true })
      .select('-__v')
      .lean<UserDocument>();
    if (!user) throw new NotFoundException('کاربر یافت نشد');
    return user;
  }

  // ── Addresses ─────────────────────────────────────────────────
  async addAddress(userId: string, dto: CreateAddressDto): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    if (user.addresses.length >= MAX_ADDRESSES)
      throw new BadRequestException(`حداکثر ${MAX_ADDRESSES} آدرس مجاز است`);

    if (dto.isDefault || user.addresses.length === 0) {
      user.addresses.forEach((a) => (a.isDefault = false));
      dto.isDefault = true;
    }

    user.addresses.push({ ...dto, _id: new Types.ObjectId() } as any);
    await user.save();
    return user.toObject();
  }

  async updateAddress(
    userId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const addr = user.addresses.find((a) => a._id.toString() === addressId);
    if (!addr) throw new NotFoundException('آدرس یافت نشد');

    if (dto.isDefault) user.addresses.forEach((a) => (a.isDefault = false));

    Object.assign(addr, dto);
    await user.save();
    return user.toObject();
  }

  async removeAddress(userId: string, addressId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const idx = user.addresses.findIndex((a) => a._id.toString() === addressId);
    if (idx === -1) throw new NotFoundException('آدرس یافت نشد');

    const wasDefault = user.addresses[idx].isDefault;
    user.addresses.splice(idx, 1);

    if (wasDefault && user.addresses.length > 0)
      user.addresses[0].isDefault = true;

    await user.save();
    return user.toObject();
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const addr = user.addresses.find((a) => a._id.toString() === addressId);
    if (!addr) throw new NotFoundException('آدرس یافت نشد');

    user.addresses.forEach((a) => (a.isDefault = a._id.toString() === addressId));
    await user.save();
    return user.toObject();
  }

  // ── Admin ─────────────────────────────────────────────────────
  async findAll(
    page = 1,
    limit = 20,
    search?: string,
    isBlocked?: string,
    role?: string,
  ): Promise<{ items: any[]; total: number }> {
    const skip    = (page - 1) * limit;
    const filter: Record<string, unknown> = {};

    if (search) {
      const re = new RegExp(search, 'i');
      filter['$or'] = [
        { phone: re },
        { firstName: re },
        { lastName: re },
      ];
    }

    if (isBlocked === 'true')  filter['isActive'] = false;
    if (isBlocked === 'false') filter['isActive'] = true;

    if (role) filter['role'] = role;

    const [users, total] = await Promise.all([
      this.userModel.find(filter).select('-__v').sort({ createdAt: -1 }).skip(skip).limit(limit).lean<UserDocument[]>(),
      this.userModel.countDocuments(filter),
    ]);

    const items = users.map(u => ({ ...u, isBlocked: !u.isActive }));
    return { items, total };
  }

  async findById(userId: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(userId))
      throw new BadRequestException('شناسه کاربر معتبر نیست');
    const user = await this.userModel.findById(userId).select('-__v').lean<UserDocument>();
    if (!user) throw new NotFoundException('کاربر یافت نشد');
    return { ...user, isBlocked: !user.isActive } as any;
  }

  async toggleBlock(userId: string): Promise<any> {
    if (!Types.ObjectId.isValid(userId))
      throw new BadRequestException('شناسه کاربر معتبر نیست');
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('کاربر یافت نشد');
    user.isActive = !user.isActive;
    await user.save();
    this.logger.log(`User ${userId} isActive → ${user.isActive}`);
    return { ...user.toObject(), isBlocked: !user.isActive };
  }
}
