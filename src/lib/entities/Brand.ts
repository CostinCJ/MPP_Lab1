import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Guitar } from "./Guitar";

@Entity("brand")
export class Brand {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    name!: string;

    @OneToMany(() => Guitar, guitar => guitar.brand)
    guitars!: Guitar[];
}