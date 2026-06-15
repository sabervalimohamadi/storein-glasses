import { Controller, Post, Param, Body, Headers, UnauthorizedException, Delete } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { EJSON } from 'bson';

@Controller('admin/seed')
export class SeedController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Post(':collection')
  async seedCollection(
    @Param('collection') collection: string,
    @Body() body: { docs: any[]; secret: string },
  ) {
    if (body.secret !== process.env.SEED_SECRET) {
      throw new UnauthorizedException('Invalid seed secret');
    }

    // Parse Extended JSON to proper BSON types
    const parsed = EJSON.parse(JSON.stringify(body.docs)) as any[];

    const coll = this.connection.db!.collection(collection);
    await coll.drop().catch(() => {});

    if (parsed.length > 0) {
      await coll.insertMany(parsed);
    }

    return { collection, count: parsed.length };
  }

  @Delete('cleanup')
  cleanup(@Headers('x-seed-secret') secret: string) {
    if (secret !== process.env.SEED_SECRET) {
      throw new UnauthorizedException();
    }
    return { message: 'Remember to remove SeedModule from AppModule after seeding!' };
  }
}
