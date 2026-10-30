import { Request, Response } from "express";
import * as PlantRepository from "@repositories/PlantRepository";
import { Luminosidade } from "@prisma/client";

const CAMPOS = [
    "nome", "especie", "preco", "estoque",
    "luminosidade", "petFriendly", "regaACadaDias",
] as const;

//Criei a função de validação, que checa se a entrada é valida dependendo dos parâmetros e exigências das requisições.
//Ela pode ser utilizada por todas as requisições, e o que determina se é POST ou PATCH é o cadastro.
const validarPlanta = (body: any, cadastro: boolean): string | null => {
    const dados = body ?? {};

    //Verifica se o campo foi realmente enviado se for POST (cadastro)
    if (cadastro) {
        for (const campo of CAMPOS) {
            if (dados[campo] === undefined) return `${campo} é obrigatório`;
        }
    }

    const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = dados;

    //Agora as condicionais de cada atributo e as respectivas mensagens de erro.
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


//É a rota do criar Planta inspirada no criar User, com o mesmo esqueleto, mas agora chamando a função validarPlanta para os diferentes erros.
export const createPlanta = async (req: Request, res: Response) => {
  try {
    const erro = validarPlanta(req.body, true);
    
    // 400 Bad Request: o cliente mandou dados incompletos
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

    // 201 Created: algo novo foi criado
    return res.status(201).json(planta);

  } catch (error) {
    console.error(error);
    // 500 Internal Server Error: o problema foi nosso, não do cliente
    return res.status(500).json({ message: "Erro ao criar planta." });
  }
};

