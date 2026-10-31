import { Request, Response } from "express";
import * as PlantRepository from "@repositories/PlantRepository";
import { Luminosidade } from "@prisma/client";

const CAMPOS = [
    "nome", "especie", "preco", "estoque",
    "luminosidade", "petFriendly", "regaACadaDias",
] as const;


const validarPlanta = (body: any, cadastro: boolean): string | null => {
    const dados = body ?? {};


    if (cadastro) {
        for (const campo of CAMPOS) {
            if (dados[campo] === undefined) return `${campo} é obrigatório`;
        }
    }

    const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = dados;


    if (nome !== undefined && (typeof nome !== "string" || nome.trim() === "")) {
        return "nome deve ser um texto não vazio";
    }
    if (especie !== undefined && (typeof especie !== "string" || especie.trim() === "")) {
        return "especie deve ser um texto não vazio";
    }
    if (preco !== undefined && (!Number.isInteger(preco) || preco <= 0)) {
        return "preco deve ser um inteiro maior que zero (em centavos)";
    }
    if (estoque !== undefined && (!Number.isInteger(estoque) || estoque < 0)) {
        return "estoque deve ser um inteiro maior ou igual a zero";
    }
    if (luminosidade !== undefined && !Object.values(Luminosidade).includes(luminosidade)) {
        return `luminosidade deve ser: ${Object.values(Luminosidade).join(", ")}`;
    }    
    if (petFriendly !== undefined && typeof petFriendly !== "boolean") {
        return "petFriendly deve ser true ou false";
    }
    if (regaACadaDias !== undefined && (!Number.isInteger(regaACadaDias) || regaACadaDias < 1)) {
        return "regaACadaDias deve ser um inteiro maior ou igual a 1";
    }
        
    return null;
};

const idValido = (valor: string): number | null => {
    const id = Number(valor);
    return Number.isInteger(id) && id > 0 ? id : null;
};


export const createPlanta = async (req: Request, res: Response) => {
  try {
    const erro = validarPlanta(req.body, true);
    

    if (erro) {
      return res.status(400).json({
        message: erro,
      });
    }

    const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = req.body;
    const planta = await PlantRepository.createPlanta({
      nome: nome,
      especie: especie,
      preco: preco,
      estoque: estoque,
      luminosidade: luminosidade,
      petFriendly: petFriendly,
      regaACadaDias: regaACadaDias
    });


    return res.status(201).json(planta);

  } catch (error) {

    return res.status(500).json({ message: "Erro ao criar planta." });
  }
};


export const findAllPlantas = async (req: Request, res: Response) => {
  try {
    const { luminosidade, petFriendly, nome, ordem } = req.query;
    
    const filtros = {
      luminosidade,
      nome,
      petFriendly:
      petFriendly === "true" ? true : petFriendly === "false" ? false : petFriendly,
    };

    const erro = validarPlanta(filtros,false);
    if (erro) {
        return res.status(400).json({ message: erro });
    }

    if (ordem !== undefined && ordem !== "preco" && ordem !== "nome") {
        return res.status(400).json({ message: "ordem deve ser preco ou nome" });
    }

    
    const plantas = await PlantRepository.findAllPlantas(
        filtros as PlantRepository.FiltrosPlanta, 
        ordem as PlantRepository.OrdemPlanta | undefined,
    );

    return res.status(200).json(plantas);

  } catch (error) {

    return res.status(500).json({ message: "Erro ao listar plantas." });
  }
};


export const findPlantaById = async (req: Request, res: Response) => {
    try {   
        const id = idValido(req.params.id);
        
        if (id === null) {
            return res.status(400).json({ message: "O ID fornecido é inválido. Deve ser um número inteiro positivo." });
        }
        const planta = await PlantRepository.findPlantaById(id);
        if (!planta) {
            
            return res.status(404).json({ message: "Planta não encontrada." });
        }
        
        return res.status(200).json(planta);
          
    } catch (error) {
        
        return res.status(500).json({ message: "Erro ao buscar planta." });
    }
};

export const updatePlanta = async (req: Request, res: Response) => {
    try {
        const id = idValido(req.params.id);
        
        if (id === null) {
            return res.status(400).json({ message: "O ID fornecido é inválido. Deve ser um número inteiro positivo." });
        }
        const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = req.body;
        
        const erro = validarPlanta(req.body,false);
        if (erro) {
            return res.status(400).json({ message: erro });
        }

        
        const planta = await PlantRepository.findPlantaById(id);

        if (!planta) {
            return res.status(404).json({ message: "Planta não encontrada." });
        }

        
        const updatedPlanta = await PlantRepository.updatePlanta(id, {
            nome: nome,
            especie: especie,
            preco: preco,
            estoque: estoque,
            luminosidade: luminosidade,
            petFriendly: petFriendly,
            regaACadaDias: regaACadaDias
        });

        return res.status(200).json(updatedPlanta);
    } catch (error) {
        
        return res.status(500).json({ message: "Erro ao atualizar planta." });
    }
};



export const deletePlanta = async (req: Request, res: Response) => {
    try {
        const id = idValido(req.params.id);
        
        if (id === null) {
            return res.status(400).json({ message: "O ID fornecido é inválido. Deve ser um número inteiro positivo." });
        }
        const planta = await PlantRepository.findPlantaById(id);
        if (!planta) {
            
            return res.status(404).json({ message: "Planta não encontrada." });
        }
        await PlantRepository.deletePlanta(id);
        
        return res.status(204).send();
    } catch (error) {
        
        return res.status(500).json({ message: "Erro ao remover planta." });
    }
};

export const sellPlanta = async (req: Request, res: Response) => {
    try {
        const id = idValido(req.params.id);
        
        if (id === null) {
            return res.status(400).json({ message: "O ID fornecido é inválido. Deve ser um número inteiro positivo." });
        }

        const quantidade = req.body?.quantidade;
        if (!Number.isInteger(quantidade) || quantidade <= 0) {
            return res.status(400).json({ message: "Quantidade deve ser um inteiro maior que zero." });
        }

        const planta = await PlantRepository.findPlantaById(id);
        if (!planta) {
            return res.status(404).json({ message: "Planta não encontrada." });
        }
        
        const alteradas = await PlantRepository.sellPlanta(id, quantidade);

        
        if (alteradas === 0) {
            return res.status(400).json({ message: `Estoque insuficiente. Temos só ${planta.estoque} vasos.` });
        }
        
        const atualizada = await PlantRepository.findPlantaById(id);

        
        return res.status(200).json(atualizada);
    } catch (error) {
        
        return res.status(500).json({ message: "Erro ao vender planta." });
    }
};

export const getValorTotalEstoque = async (req: Request, res: Response) => {
    try {
        const total = await PlantRepository.getValorTotalEstoque();

        return res.status(200).json(total);
    } catch(error) {
        
        return res.status(500).json({ message: "Erro ao somar valor total de estoque." });
    }
};

export const findPlantasEsgotadas = async (req: Request, res: Response) => {
    try {
        const plantas = await PlantRepository.findPlantasEsgotadas();
        
        return res.status(200).json(plantas);
    } catch (error) {
        
        return res.status(500).json({ message: "Erro ao listar plantas esgotadas." });
    }
};
