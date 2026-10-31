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

const idValido = (valor: string): number | null => {
    const id = Number(valor);
    return Number.isInteger(id) && id > 0 ? id : null;
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


export const findAllPlantas = async (req: Request, res: Response) => {
  try {
    const { luminosidade, petFriendly, nome } = req.query;
    //Adaptação para utilizar validarPlanta
    //converte "true"/"false" para boolean; qualquer outro valor segue como veio
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
    // 200 OK: algo foi atualizado
    const plantas = await PlantRepository.findAllPlantas(filtros as PlantRepository.FiltrosPlanta);
    return res.status(200).json(plantas);

  } catch (error) {
    console.error(error);
    // 500 Internal Server Error: o problema foi nosso, não do cliente
    return res.status(500).json({ message: "Erro ao listar plantas." });
  }
};


export const findPlantaById = async (req: Request, res: Response) => {
    try {   
        const id = idValido(req.params.id);
        // 400 Bad Request: o id não é número inteiro positivo
        if (id === null) {
            return res.status(400).json({ message: "O ID fornecido é inválido. Deve ser um número inteiro positivo." });
        }
        const planta = await PlantRepository.findPlantaById(id);
        if (!planta) {
            // 404 Not Found: o id é válido, mas a planta não existe
            return res.status(404).json({ message: "Planta não encontrada." });
        }
        // 200 OK: planta encontrada
        return res.status(200).json(planta);
          
    } catch (error) {
        console.error(error);
        // 500 Internal Server Error: o problema foi nosso, não do cliente
        return res.status(500).json({ message: "Erro ao buscar planta." });
    }
};

export const updatePlanta = async (req: Request, res: Response) => {
    try {
        const id = idValido(req.params.id);
        //Verifica se o id é válido
        if (id === null) {
            return res.status(400).json({ message: "O ID fornecido é inválido. Deve ser um número inteiro positivo." });
        }
        const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = req.body;
        
        const erro = validarPlanta(req.body,false);
        if (erro) {
            return res.status(400).json({ message: erro });
        }

        // Antes de editar, garantimos que o usuário existe
        const planta = await PlantRepository.findPlantaById(id);

        if (!planta) {
            return res.status(404).json({ message: "Planta não encontrada." });
        }

         // PATCH = atualização parcial: campos não enviados (undefined) não são alterados
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
        console.error(error);
        // 500 Internal Server Error: o problema foi nosso, não do cliente
        return res.status(500).json({ message: "Erro ao atualizar planta." });
    }
};



export const deletePlanta = async (req: Request, res: Response) => {
    try {
        const id = idValido(req.params.id);
        // 400 Bad Request: o id não é número inteiro positivo
        if (id === null) {
            return res.status(400).json({ message: "O ID fornecido é inválido. Deve ser um número inteiro positivo." });
        }
        const planta = await PlantRepository.findPlantaById(id);
        if (!planta) {
            // 404 Not Found: o id é válido, mas a planta não existe
            return res.status(404).json({ message: "Planta não encontrada." });
        }
        await PlantRepository.deletePlanta(id);
        // 204 No content: deu certo e não há nada para devolver
        return res.status(204).send();
    } catch (error) {
        console.error(error);
        // 500 Internal Server Error: o problema foi nosso, não do cliente
        return res.status(500).json({ message: "Erro ao remover planta." });
    }
};

export const sellPlanta = async (req: Request, res: Response) => {
    try {
        const id = idValido(req.params.id);
        // 400 Bad Request: o id não é número inteiro positivo
        if (id === null) {
            return res.status(400).json({ message: "O ID fornecido é inválido. Deve ser um número inteiro positivo." });
        }

        const quantidade = req.body?.quantidade;
        if (!Number.isInteger(quantidade) || quantidade <= 0) {
            return res.status(400).json({ message: "Quantidade deve ser um inteiro maior que zero." });
        }

        const planta = await PlantRepository.findPlantaById(id);
        if (!planta) {
            // 404 Not Found: o id é válido, mas a planta não existe
            return res.status(404).json({ message: "Planta não encontrada." });
        }
        
        const alteradas = await PlantRepository.sellPlanta(id, quantidade);

        // 400 Bad Request: estoque insuficiente (nada foi alterado)
        if (alteradas === 0) {
            return res.status(400).json({ message: `Estoque insuficiente. Temos só ${planta.estoque} vasos.` });
        }
        
        const atualizada = await PlantRepository.findPlantaById(id);

        // 200 OK: venda registrada, devolve a planta com o estoque novo
        return res.status(200).json(atualizada);
    } catch (error) {
        console.error(error);
        // 500 Internal Server Error: o problema foi nosso, não do cliente
        return res.status(500).json({ message: "Erro ao vender planta." });
    }
};

export const getValorTotalEstoque = async (req: Request, res: Response) => {
    try {
        const total = await PlantRepository.getValorTotalEstoque();

        // 200 OK: devolve { valorTotalEmCentavos, totalDeVasos }
        return res.status(200).json(total);
    } catch(error) {
        console.error(error);
        // 500 Internal Server Error: o problema foi nosso, não do cliente
        return res.status(500).json({ message: "Erro ao somar valor total de estoque." });
    }
};

export const findPlantasEsgotadas = async (req: Request, res: Response) => {
    try {
        const plantas = await PlantRepository.findPlantasEsgotadas();
        // 200 OK: lista de plantas com estoque zero (pode ser vazia)
        return res.status(200).json(plantas);
    } catch (error) {
        console.error(error);
        // 500 Internal Server Error: o problema foi nosso, não do cliente
        return res.status(500).json({ message: "Erro ao listar plantas esgotadas." });
    }
};
