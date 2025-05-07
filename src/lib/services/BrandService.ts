import { AppDataSource, initializeDataSource } from "../database/data-source";
import { Brand } from "@/lib/entities/Brand";
import { Like, FindManyOptions, FindOptionsWhere, FindOptionsOrder } from "typeorm";

interface BrandFilter {
    name?: string;
}

interface BrandSort {
    name?: "ASC" | "DESC";
}

export const getBrands = async (filter?: BrandFilter, sort?: BrandSort) => {
    await initializeDataSource();
    const brandRepository = AppDataSource.getRepository(Brand);

    const findOptions: FindManyOptions<Brand> = {
        where: {},
        order: {}
    };

    if (filter) {
        if (filter.name) {
            (findOptions.where as FindOptionsWhere<Brand>).name = Like(`%${filter.name}%`);
        }
    }

    if (sort) {
        if (sort.name) {
            (findOptions.order as FindOptionsOrder<Brand>).name = sort.name;
        }
    }

    return brandRepository.find(findOptions);
};

export const getBrandById = async (id: number) => {
    await initializeDataSource();
    const brandRepository = AppDataSource.getRepository(Brand);
    return brandRepository.findOne({ where: { id } });
};

export const createBrand = async (brandData: { name: string }) => {
    await initializeDataSource();
    const brandRepository = AppDataSource.getRepository(Brand);

    const newBrand = brandRepository.create({ name: brandData.name });
    return brandRepository.save(newBrand);
};

export const updateBrand = async (id: number, brandData: { name?: string }) => {
    await initializeDataSource();
    const brandRepository = AppDataSource.getRepository(Brand);

    const brandToUpdate = await brandRepository.findOne({ where: { id } });

    if (!brandToUpdate) {
        return null;
    }

    if (brandData.name !== undefined) {
        brandToUpdate.name = brandData.name;
    }

    return brandRepository.save(brandToUpdate);
};

export const deleteBrand = async (id: number) => {
    await initializeDataSource();
    const brandRepository = AppDataSource.getRepository(Brand);
    const result = await brandRepository.delete(id);
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
};