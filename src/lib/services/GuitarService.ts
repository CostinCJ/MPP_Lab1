import { AppDataSource, getInitializedDataSource } from "../database/data-source";
import { Guitar } from "@/lib/entities/Guitar";
import { Brand } from "@/lib/entities/Brand";
import { ILike, FindManyOptions, FindOptionsWhere, FindOptionsOrder, Between, In, MoreThanOrEqual, LessThanOrEqual } from "typeorm"; // Import MoreThanOrEqual and LessThanOrEqual

interface GuitarFilter {
    model?: string;
    year?: number;
    brandName?: string | string[];
    condition?: string | string[];
    type?: string | string[];
    strings?: number | number[];
    minPrice?: number;
    maxPrice?: number;
    search?: string;
}

interface GuitarSort {
    model?: "ASC" | "DESC";
    year?: "ASC" | "DESC";
    brandName?: "ASC" | "DESC";
    price?: "ASC" | "DESC";
}

export const getGuitars = async (filter?: GuitarFilter, sort?: GuitarSort) => {
    await getInitializedDataSource();
    const guitarRepository = AppDataSource.getRepository(Guitar);

    const findOptions: FindManyOptions<Guitar> = {
        relations: ["brand"],
        where: {},
        order: {}
    };

    if (filter) {
        if (filter.model) {
            (findOptions.where as FindOptionsWhere<Guitar>).model = ILike(`%${filter.model}%`);
        }
        if (filter.brandName) {
            (findOptions.where as FindOptionsWhere<Guitar>).brand = { name: Array.isArray(filter.brandName) ? In(filter.brandName) : ILike(`%${filter.brandName}%`) };
        }
        if (filter.type) {
            (findOptions.where as FindOptionsWhere<Guitar>).type = Array.isArray(filter.type) ? In(filter.type) : filter.type;
        }
        if (filter.condition) {
            (findOptions.where as FindOptionsWhere<Guitar>).condition = Array.isArray(filter.condition) ? In(filter.condition) : filter.condition;
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
                 { model: ILike(`%${filter.search}%`) },
                 { brand: { name: ILike(`%${filter.search}%`) } }
             ];
         }
     }

    if (sort) {
        if (sort.model) {
            (findOptions.order as FindOptionsOrder<Guitar>).model = sort.model;
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
    await getInitializedDataSource();
    const guitarRepository = AppDataSource.getRepository(Guitar);
    return guitarRepository.findOne({ where: { id }, relations: ["brand"] });
};

export const createGuitar = async (guitarData: { model: string; year?: number; brandName?: string; type: string; strings: number; condition: string; price: number; imageUrl?: string }) => {
    console.log("GuitarService: createGuitar called with guitarData:", JSON.stringify(guitarData, null, 2));
    const dataSource = await getInitializedDataSource();
    const guitarRepository = dataSource.getRepository(Guitar);
    const brandRepository = dataSource.getRepository(Brand);

    if (!guitarData.brandName) {
        console.error("GuitarService: Brand name is missing in guitarData.");
        throw new Error("Brand name is required to create a guitar.");
    }
    console.log(`GuitarService: Attempting to find or create brand: ${guitarData.brandName}`);

    let brandToAssociate: Brand;
    const existingBrand = await brandRepository.findOne({ where: { name: guitarData.brandName } });
    if (!existingBrand) {
        console.log(`GuitarService: Brand "${guitarData.brandName}" not found. Creating new brand.`);
        const newBrandInstance = brandRepository.create({ name: guitarData.brandName });
        brandToAssociate = await brandRepository.save(newBrandInstance);
        console.log("GuitarService: New brand saved. brandToAssociate:", JSON.stringify(brandToAssociate, null, 2));
    } else {
        console.log(`GuitarService: Existing brand found:`, JSON.stringify(existingBrand, null, 2));
        brandToAssociate = existingBrand;
    }

    console.log("GuitarService: Final brandToAssociate ID before guitar creation:", brandToAssociate.id);

    const valuesToInsert: Partial<Guitar> = {
        model: guitarData.model,
        type: guitarData.type,
        strings: guitarData.strings,
        condition: guitarData.condition,
        price: guitarData.price,
        imageUrl: guitarData.imageUrl,
        brand: { id: brandToAssociate.id } as Brand
    };

    console.log("GuitarService: Values for guitar insertion:", JSON.stringify(valuesToInsert, null, 2));

    try {
        console.log("GuitarService: Attempting to insert new guitar using QueryBuilder...");
        const insertResult = await guitarRepository.createQueryBuilder()
            .insert()
            .into(Guitar)
            .values(valuesToInsert)
            .execute();
        
        console.log("GuitarService: Guitar inserted successfully with QueryBuilder. Result:", JSON.stringify(insertResult, null, 2));

        if (insertResult.identifiers && insertResult.identifiers.length > 0 && insertResult.identifiers[0].id) {
            const newGuitarId = insertResult.identifiers[0].id;
            console.log(`GuitarService: New guitar ID: ${newGuitarId}. Fetching the created guitar...`);
            const createdGuitar = await getGuitarById(newGuitarId);
            if (!createdGuitar) {
                 console.error(`GuitarService: Failed to fetch newly created guitar with ID: ${newGuitarId}`);
                 throw new Error(`Failed to fetch newly created guitar with ID: ${newGuitarId}`);
            }
            console.log("GuitarService: Successfully fetched created guitar:", JSON.stringify(createdGuitar, null, 2));
            return createdGuitar;
        } else {
            console.error("GuitarService: Insert operation did not return a valid ID.");
            throw new Error("Guitar creation failed to return an ID.");
        }

    } catch (error) {
        console.error(`Error during guitar insert process (Brand ID: ${brandToAssociate?.id || 'unknown'}):`, error);
        console.error("GuitarService: Guitar data at time of failure:", JSON.stringify(valuesToInsert, null, 2));
        console.error("GuitarService: Brand object intended for association:", JSON.stringify(brandToAssociate, null, 2));
        throw error;
    }
};

export const updateGuitar = async (id: number, guitarData: { model?: string; year?: number; brandName?: string; type?: string; strings?: number; condition?: string; price?: number; imageUrl?: string }) => {
    await getInitializedDataSource();
    const guitarRepository = AppDataSource.getRepository(Guitar);
    const brandRepository = AppDataSource.getRepository(Brand);

    const guitarToUpdate = await guitarRepository.findOne({ where: { id }, relations: ["brand"] });

    if (!guitarToUpdate) {
        return null;
    }

    if (guitarData.model !== undefined) {
        guitarToUpdate.model = guitarData.model;
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
            brand = await brandRepository.save(brand);
        }
        guitarToUpdate.brand = { id: brand.id } as Brand;
    }


    return guitarRepository.save(guitarToUpdate);
};

export const deleteGuitar = async (id: number) => {
    await getInitializedDataSource();
    const guitarRepository = AppDataSource.getRepository(Guitar);
    const result = await guitarRepository.delete(id);
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
};