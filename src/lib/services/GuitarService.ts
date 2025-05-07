import { AppDataSource, initializeDataSource } from "../database/data-source";
import { Guitar } from "@/lib/entities/Guitar";
import { Brand } from "@/lib/entities/Brand";
import { Like, FindManyOptions, FindOptionsWhere, FindOptionsOrder, Between, In, MoreThanOrEqual, LessThanOrEqual } from "typeorm"; // Import MoreThanOrEqual and LessThanOrEqual

interface GuitarFilter {
    model?: string;
    year?: number;
    brandName?: string | string[];
    type?: string | string[];
    strings?: number | number[];
    minPrice?: number;
    maxPrice?: number;
    search?: string; // Add search property
}

interface GuitarSort {
    model?: "ASC" | "DESC";
    year?: "ASC" | "DESC";
    brandName?: "ASC" | "DESC";
    price?: "ASC" | "DESC";
}

export const getGuitars = async (filter?: GuitarFilter, sort?: GuitarSort) => {
    await initializeDataSource();
    const guitarRepository = AppDataSource.getRepository(Guitar);

    const findOptions: FindManyOptions<Guitar> = {
        relations: ["brand"],
        where: {},
        order: {}
    };

    if (filter) {
        if (filter.model) {
            (findOptions.where as FindOptionsWhere<Guitar>).model = Like(`%${filter.model}%`);
        }
        if (filter.year) {
            (findOptions.where as FindOptionsWhere<Guitar>).year = filter.year;
        }
        if (filter.brandName) {
            (findOptions.where as FindOptionsWhere<Guitar>).brand = { name: Array.isArray(filter.brandName) ? In(filter.brandName) : Like(`%${filter.brandName}%`) };
        }
        if (filter.type) {
            (findOptions.where as FindOptionsWhere<Guitar>).type = Array.isArray(filter.type) ? In(filter.type) : filter.type;
        }
         if (filter.strings) {
            (findOptions.where as FindOptionsWhere<Guitar>).strings = Array.isArray(filter.strings) ? In(filter.strings) : filter.strings;
        }
        if (filter.minPrice !== undefined && filter.maxPrice !== undefined) {
             (findOptions.where as FindOptionsWhere<Guitar>).price = Between(filter.minPrice, filter.maxPrice);
        } else if (filter.minPrice !== undefined) {
             (findOptions.where as FindOptionsWhere<Guitar>).price = MoreThanOrEqual(filter.minPrice);
        } else if (filter.maxPrice !== undefined) {
             (findOptions.where as FindOptionsWhere<Guitar>).price = LessThanOrEqual(filter.maxPrice);
        }
 
         if (filter.search) {
             // Apply search filter to model and brand name
             (findOptions.where as FindOptionsWhere<Guitar> | FindOptionsWhere<Guitar>[]) = [
                 { model: Like(`%${filter.search}%`) },
                 { brand: { name: Like(`%${filter.search}%`) } }
             ];
         }
     }

    if (sort) {
        if (sort.model) {
            (findOptions.order as FindOptionsOrder<Guitar>).model = sort.model;
        }
        if (sort.year) {
            (findOptions.order as FindOptionsOrder<Guitar>).year = sort.year;
        }
        if (sort.brandName) {
            (findOptions.order as FindOptionsOrder<Guitar>).brand = { name: sort.brandName };
        }
        if (sort.price) {
            (findOptions.order as FindOptionsOrder<Guitar>).price = sort.price;
        }
    }

    return guitarRepository.find(findOptions);
};

export const getGuitarById = async (id: number) => {
    await initializeDataSource();
    const guitarRepository = AppDataSource.getRepository(Guitar);
    return guitarRepository.findOne({ where: { id }, relations: ["brand"] });
};

export const createGuitar = async (guitarData: { model: string; year?: number; brandName?: string; type: string; strings: number; condition: string; price: number; imageUrl?: string }) => {
    await initializeDataSource();
    const guitarRepository = AppDataSource.getRepository(Guitar);
    const brandRepository = AppDataSource.getRepository(Brand);

    let brand = null;
    if (guitarData.brandName) {
        brand = await brandRepository.findOne({ where: { name: guitarData.brandName } });
        if (!brand) {
            brand = brandRepository.create({ name: guitarData.brandName });
            await brandRepository.save(brand);
        }
    }

    const newGuitar = new Guitar();
    newGuitar.model = guitarData.model;
    if (guitarData.year !== undefined) {
        newGuitar.year = guitarData.year;
    }
    newGuitar.type = guitarData.type;
    newGuitar.strings = guitarData.strings;
    newGuitar.condition = guitarData.condition;
    newGuitar.price = guitarData.price;
    if (guitarData.imageUrl !== undefined) {
        newGuitar.imageUrl = guitarData.imageUrl;
    }
    newGuitar.brand = brand as Brand;

    return guitarRepository.save(newGuitar);
};

export const updateGuitar = async (id: number, guitarData: { model?: string; year?: number; brandName?: string; type?: string; strings?: number; condition?: string; price?: number; imageUrl?: string }) => {
    await initializeDataSource();
    const guitarRepository = AppDataSource.getRepository(Guitar);
    const brandRepository = AppDataSource.getRepository(Brand);

    const guitarToUpdate = await guitarRepository.findOne({ where: { id }, relations: ["brand"] });

    if (!guitarToUpdate) {
        return null;
    }

    if (guitarData.model !== undefined) {
        guitarToUpdate.model = guitarData.model;
    }
    if (guitarData.year !== undefined) {
        guitarToUpdate.year = guitarData.year;
    }
    if (guitarData.type !== undefined) {
        guitarToUpdate.type = guitarData.type;
    }
    if (guitarData.strings !== undefined) {
        guitarToUpdate.strings = guitarData.strings;
    }
    if (guitarData.condition !== undefined) {
        guitarToUpdate.condition = guitarData.condition;
    }
    if (guitarData.price !== undefined) {
        guitarToUpdate.price = guitarData.price;
    }
    if (guitarData.imageUrl !== undefined) {
        guitarToUpdate.imageUrl = guitarData.imageUrl;
    }


    if (guitarData.brandName !== undefined) {
        let brand = await brandRepository.findOne({ where: { name: guitarData.brandName } });
        if (!brand) {
            brand = brandRepository.create({ name: guitarData.brandName });
            await brandRepository.save(brand);
        }
        guitarToUpdate.brand = brand;
    }


    return guitarRepository.save(guitarToUpdate);
};

export const deleteGuitar = async (id: number) => {
    await initializeDataSource();
    const guitarRepository = AppDataSource.getRepository(Guitar);
    const result = await guitarRepository.delete(id);
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
};