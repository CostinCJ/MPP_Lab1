import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, OneToMany } from "typeorm";
import { IsEmail, IsString, MinLength, IsOptional, IsDate } from "class-validator";
import { Guitar } from "./Guitar";

@Entity("users")
@Unique(["email"])
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @IsOptional()
  @IsString()
  @Column({ type: "varchar", length: 255, nullable: true })
  name?: string | null;

  @IsEmail()
  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @IsOptional()
  @IsDate()
  @Column({ type: "timestamp", nullable: true })
  emailVerified?: Date | null;

  @IsOptional()
  @IsString()
  @Column({ type: "varchar", length: 255, nullable: true })
  image?: string | null;

  @IsString()

  @Column({ type: "varchar", length: 255, select: false })
  password!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Guitar, guitar => guitar.user)
  guitars!: Guitar[];
}