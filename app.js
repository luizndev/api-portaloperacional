const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dns = require("dns");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// Conectar ao MongoDB
mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_CLUSTER_URL}/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err.message));

// Modelos

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  sector: {
    type: String,
    required: true,
  },
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model("User", UserSchema);

const TiCallSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  sector: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  deadline: {
    type: Date,
    required: true,
  },
});

const TiCall = mongoose.model("TiCall", TiCallSchema);

const ManutencaoCallSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  sector: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  deadline: {
    type: Date,
    required: true,
  },
});

const ManutencaoCall = mongoose.model("ManutencaoCall", ManutencaoCallSchema);

// Rotas

// Registro
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, sector } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "Usuário já existe" });
    }

    user = new User({
      name,
      email,
      password,
      sector,
    });

    await user.save();

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Erro no servidor");
  }
});

// Open Route
app.get("/", (req, res) => {
  res.status(200).json({ message: "Bem vindo a api" });
});

// Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Credenciais inválidas" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Credenciais inválidas" });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Erro no servidor");
  }
});

// Abrir Chamado TI
app.post("/api/calls/ti", async (req, res) => {
  const { name, email, sector, description } = req.body;

  try {
    const createdAt = new Date();
    const deadline = new Date(createdAt);
    deadline.setDate(deadline.getDate() + 7);

    const tiCall = new TiCall({
      name,
      email,
      sector,
      description,
      createdAt,
      deadline,
    });

    await tiCall.save();

    const payload = {
      call: {
        id: tiCall.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Erro no servidor");
  }
});

// Abrir Chamado Manutenção
app.post("/api/calls/manutencao", async (req, res) => {
  const { name, email, sector, description } = req.body;

  try {
    const createdAt = new Date();
    const deadline = new Date(createdAt);
    deadline.setDate(deadline.getDate() + 7);

    const manutencaoCall = new ManutencaoCall({
      name,
      email,
      sector,
      description,
      createdAt,
      deadline,
    });

    await manutencaoCall.save();

    const payload = {
      call: {
        id: manutencaoCall.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Erro no servidor");
  }
});

// Obter todos os chamados de TI
app.get("/api/calls/ti", async (req, res) => {
  try {
    const tiCalls = await TiCall.find();
    res.json(tiCalls);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Erro no servidor");
  }
});

// Obter todos os chamados de Manutenção
app.get("/api/calls/manutencao", async (req, res) => {
  try {
    const manutencaoCalls = await ManutencaoCall.find();
    res.json(manutencaoCalls);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Erro no servidor");
  }
});

app.listen(80, () => {
  console.log("Servidor Ligado com sucesso.");
});
