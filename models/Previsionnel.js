import mongoose from 'mongoose'

const PrevisionnelSchema = new mongoose.Schema({
  date: { type: String, required: true },
  heure_debut: { type: String, required: true },
  heure_fin: { type: String, required: true },
  duree_minutes: { type: Number, required: true },
  classe: { type: String, required: true },
  module: { type: String, default: '' },
  matiere: { type: String, default: '' },
  type: {
    type: String,
    enum: ['cours', 'ccf', 'jury', 'service', 'recup', 'veillee', 'autre'],
    default: 'cours'
  },
  seance_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Seance', default: null },
  ireo_uid: { type: String, default: '' },
}, { timestamps: true })

PrevisionnelSchema.index({ date: 1 })
PrevisionnelSchema.index({ classe: 1, date: 1 })

export default mongoose.models.Previsionnel || mongoose.model('Previsionnel', PrevisionnelSchema)
