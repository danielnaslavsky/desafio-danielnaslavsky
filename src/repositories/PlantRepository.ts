import { Prisma, Luminosidade } from "@prisma/client";
import prisma from "@database";

export const createPlanta = async (data: Prisma.PlantaCreateInput) => {
    return await prisma.planta.create({
        data: data
    });
};

export interface FiltrosPlanta {
    luminosidade?: Luminosidade;
    petFriendly?: boolean;
    nome?: string;
}

export type OrdemPlanta = "preco" | "nome";

export const findAllPlantas = async (filtros: FiltrosPlanta = {}, ordem?: OrdemPlanta) => {
    const { nome, luminosidade, petFriendly } = filtros;
    return await prisma.planta.findMany({
        where:  {
        luminosidade,
        petFriendly, 
        nome: nome !== undefined ? { contains: nome, mode: "insensitive" } : undefined
        },
        orderBy: ordem !== undefined ? { [ordem]: "asc" } : undefined,
    });
};
    
export const findPlantaById = async (id: number) => {
    return await prisma.planta.findUnique({
        where: { id: id }
    });
};

export const updatePlanta = async (id: number, data: Prisma.PlantaUpdateInput) => {
    return await prisma.planta.update({
        where: { id: id },
        data: data,
    });
};

export const deletePlanta = async (id: number) => {
    return await prisma.planta.delete({
        where: { id: id }
    });
};


export const sellPlanta = async (id: number,quantidade : number) => {
    const resultado = await prisma.planta.updateMany({
        where: { id, estoque: { gte: quantidade } },
        data: { estoque: { decrement: quantidade } },
    });
    return resultado.count;
};


export const getValorTotalEstoque = async () => {
    const plantas = await prisma.planta.findMany({
        select: { preco: true, estoque: true },
    });

    return {
        valorTotalEmCentavos: plantas.reduce((soma, p) => soma + p.preco * p.estoque, 0),
        totalDeVasos: plantas.reduce((soma, p) => soma + p.estoque, 0),
    };
};

export const findPlantasEsgotadas = async () => {
    return await prisma.planta.findMany({ where: { estoque: 0 } });
};
