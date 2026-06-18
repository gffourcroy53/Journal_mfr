import mongoose from 'mongoose'

const ClasseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  libelle: { type: String, required: true },
  couleur: { type: String, default: '#2E86C1' },
  annee: { type: String, default: '2025-2026' },
  actif: { type: Boolean, default: true },
}, { timestamps: true })

const SettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
  description: { type: String, default: '' },
}, { timestamps: true })

export const Classe = mongoose.models.Classe || mongoose.model('Classe', ClasseSchema)
export const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema)
