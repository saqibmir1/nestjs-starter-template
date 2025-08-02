import { BaseModel } from '../../common/entities/base.model';
import { BeforeInsert, BeforeUpdate, Column, Entity } from 'typeorm';
import * as argon2 from 'argon2';
import { IsEmail, Length, IsOptional } from 'class-validator';

@Entity('users')
export class User extends BaseModel {
  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column({ nullable: true })
  @IsOptional()
  @Length(8, 20)
  password: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ default: false, name: 'is_verified' })
  isVerified: boolean;

  @Column({ nullable: true, name: 'oauth_provider' })
  oauthProvider: string;

  @BeforeUpdate()
  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      this.password = await argon2.hash(this.password);
    }
  }
}
