## Projeto API - Programação Web II (ESMAD)

Projeto desenvolvido como trabalho avaliativo para a matéria de Programação Web II.

1. [Como Rodar](#como-rodar)
2. [Objetivo](#objetivo)
3. [Tecnologias](#tecnologias)
4. [Motivações para Tecnologias](#motivações-para-tecnologias)
5. [Documentação](#documentação)

### Como Rodar

Primeiro, configure as variáveis de ambiente. Preencha as informações no .env com base no .env.example

Se não tiver mysql instalado na máquina, rode o seguinte comando:

```
docker compose up
```

Baixe as dependências:

```
npm install
```

Rode as migrations:

```
npm run migrate:up
```

Rode o projeto:

```
npm run dev
```

### Objetivo

Esse projeto busca implementar uma API RESTful para resolver o seguinte problema:

> O Campus da ESMAD pretende implementar uma solução inspirada no conceito de smart city, permitindo à comunidade académica reportar, acompanhar e monitorizar problemas relacionados com sustentabilidade, manutenção e qualidade de vida no espaço do Campus.

> Problemas como lixo acumulado, falhas de iluminação, ruído excessivo, barreiras de acessibilidade, fugas de água ou degradação de espaços comuns impactam diretamente a vivência académica. Atualmente, estes registos são feitos de forma informal e pouco estruturada.

> Pretende-se assim o desenvolvimento de uma API REST que suporte uma aplicação de gestão de ocorrências no Campus, promovendo participação ativa e melhoria contínua.

### Tecnologias

O enunciado do trabalho pede para usarmos ExpressJS e Sequelize (MySQL) ou Mongoose (MongoDB).

Optei por MySQL por preferir uma abordagem relacional para a maioria dos problemas, especialmente nesse caso onde quero fazer vários joins, ter que fazer com o pipeline no mongo é menos prático.

- MySQL
- Sequelize

Além das tecnologias que nos foram apontadas, tomei a liberdade de adicionar mais algumas à minha API:

- Pino (logging)
- BCrypt (hash das senhas)
- Multer (parse dos multipart/form-data)
- Sharp (compactar imagens)
- Zod (validação de body)

Também decidi usar typescript, já que acredito que é muito melhor para manutenção do código.

### Motivações para Tecnologias

#### Pino

Escolhi o pino por gostar da sintaxe simples e dos logs com pino-pretty para desenvolvimento. Além disso tem pouco overhead, o que é um ponto importante em produção.

#### BCrypt

Sempre usei bcrypt nos meus projetos, é simples e não exige configuração.

#### Multer

Pensei em usar busboy diretamente para um controle mais fino dos arquivos, ou até mesmo implementar um parser eu mesmo. Sempre tive a mentalidade de evitar libs, mas decidi ser mais prático. Multer funciona para meu caso de uso, então decidi usá-lo. Acho que foi a lib que mais pensei para colocar.

#### Sharp

Já usei em outros projetos e é bem simples de usar. Funciona perfeitamente para o que quero, que é simplesmente comprimir imagens sem dor de cabeça.

#### Zod

Estava em dúvida entre Zod e VineJS. Trabalhei com AdonisJS por algum tempo e vi que vine é mais rápido, mas na época sentia falta de algumas funções e o zod parece bem interessante. Vai ser legal testar uma lib de validação nova. Além disso, velocidade não vai fazer diferença na minha API.

### Documentação

Ainda não fiz o Swagger :)

Mas vai sair. É um requisito hahahah
