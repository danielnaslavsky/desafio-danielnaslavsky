import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    await prisma.planta.deleteMany();

    await prisma.planta.createMany({
        data: [
            { nome: "Costela-de-adão", especie: "Monstera deliciosa", preco: 8990, estoque: 12, luminosidade: "MEIA_SOMBRA", petFriendly: false, regaACadaDias: 3 },
            { nome: "Samambaia", especie: "Nephrolepis exaltata", preco: 3500, estoque: 5, luminosidade: "SOMBRA", petFriendly: true, regaACadaDias: 2 },
            { nome: "Cacto", especie: "Cactaceae", preco: 1500, estoque: 0, luminosidade: "SOL_PLENO", petFriendly: true, regaACadaDias: 15 },
            { nome: "Jiboia", especie: "Epipremnum aureum", preco: 4500, estoque: 8, luminosidade: "MEIA_SOMBRA", petFriendly: false, regaACadaDias: 7 },
            { nome: "Violeta", especie: "Saintpaulia ionantha", preco: 2500, estoque: 0, luminosidade: "SOMBRA", petFriendly: true, regaACadaDias: 4 },
        ],
    });
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());