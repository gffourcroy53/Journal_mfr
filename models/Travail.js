import mongoose from 'mongoose'

const TravailSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  type: {
    type: String,
    enum: ['tpe', 'devoir_alternance', 'recherche', 'projet', 'autre'],
    default: 'tpe'
  },
  classe: { type: String, required: true },
  module: { type: String, default: '' },
  matiere: { type: String, default: '' },
  date_donnee: { type: String, required: true }, // YYYY-MM-DD
  date_remise: { type: String, default: '' },
  consigne: { type: String, default: '' },
  statut: {
    type: String,
    enum: ['en_cours', 'rendu', 'corrige'],
    default: 'en_cours'
  },
  seance_origine: { type: mongoose.Schema.Types.ObjectId, ref: 'Seance', default: null },
}, { timestamps: true })

TravailSchema.index({ classe: 1, statut: 1 })
TravailSchema.index({ date_remise: 1, statut: 1 })

export default mongoose.models.Travail || mongoose.model('Travail', TravailSchema)
