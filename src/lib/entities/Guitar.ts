import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Brand } from "./Brand";

@Entity()
export class Guitar {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    model!: string;

    @Column({ nullable: true })
    year?: number;

    @Column()
    type!: string; // Added type

    @Column()
    strings!: number; // Changed strings to number

    @Column()
    condition!: string; // Added condition

    @Column("decimal", { precision: 10, scale: 2 }) // Added price as decimal
    price!: number;

    @Column({ nullable: true }) // Added imageUrl
    imageUrl?: string;

    @ManyToOne(() => Brand, brand => brand.guitars)
    brand!: Brand;
}