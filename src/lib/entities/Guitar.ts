import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Brand } from "./Brand";
import { User } from "./User"; // Import your custom User entity

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

    // Add relation to User
    @Column({ type: "uuid" }) // Assuming User ID is UUID
    userId!: string;

    @ManyToOne(() => User, user => user.guitars) // Define the inverse side in User entity
    @JoinColumn({ name: "userId" }) // Specify the foreign key column name
    user!: User;
}