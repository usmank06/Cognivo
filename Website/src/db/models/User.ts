import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  totalTokensSpent: number;
  totalMoneySpent: number;
  theme: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    totalTokensSpent: {
      type: Number,
      default: 0,
    },
    totalMoneySpent: {
      type: Number,
      default: 0,
    },
    theme: {
      type: String,
      default: 'corporate',
      enum: ['orange', 'indigo', 'green', 'monochrome', 'corporate', 'pitch'],
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);

// Deleted users collection (soft delete)
export interface IDeletedUser extends Document {
  username: string;
  email: string;
  password: string;
  totalTokensSpent: number;
  totalMoneySpent: number;
  deletedAt: Date;
  originalCreatedAt: Date;
  originalUpdatedAt: Date;
}

const DeletedUserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    totalTokensSpent: {
      type: Number,
      default: 0,
    },
    totalMoneySpent: {
      type: Number,
      default: 0,
    },
    deletedAt: {
      type: Date,
      default: Date.now,
    },
    originalCreatedAt: {
      type: Date,
    },
    originalUpdatedAt: {
      type: Date,
    },
  }
);

export const DeletedUser = mongoose.model<IDeletedUser>('DeletedUser', DeletedUserSchema);
