import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Brand } from "./Brand";

@Entity("guitar")
export class Guitar {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    model!: string;

    @Column()
    type!: string;

    @Column()
    strings!: number;

    @Column()
    condition!: string;

    @Column("decimal", { precision: 10, scale: 2 })
    price!: number;

    @Column({ type: "text", nullable: true })
    imageUrl?: string;

    @ManyToOne(() => Brand, brand => brand.guitars)
    brand!: Brand;
}