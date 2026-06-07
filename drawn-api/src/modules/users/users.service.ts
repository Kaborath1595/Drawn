import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async existsByUsername(username: string): Promise<boolean> {
    const count = await this.userModel.countDocuments({ username });
    return count > 0;
  }

  create(username: string, hashedPassword: string, role: 'patient' | 'specialist'): Promise<UserDocument> {
    return new this.userModel({ username, password: hashedPassword, role }).save();
  }
}
