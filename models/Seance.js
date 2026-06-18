import mongoose from 'mongoose'

const SeanceSchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  heure_debut: { type: String, required: true }, // HH:MM
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
  contenu: { type: String, default: '' },
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DocPeda' }],
  travaux: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Travail' }],
  source: { type: String, enum: ['ireo', 'manuel'], default: 'ireo' },
  statut: { type: String, enum: ['saisi', 'a_completer'], default: 'a_completer' },
  ireo_uid: { type: String, default: '' }, // UID de l'événement iCal source
}, { timestamps: true })

// Index pour les requêtes fréquentes
SeanceSchema.index({ date: 1 })
SeanceSchema.index({ classe: 1, date: 1 })
SeanceSchema.index({ type: 1, date: 1 })
SeanceSchema.index({ ireo_uid: 1 }, { unique: true, sparse: true })

export default mongoose.models.Seance || mongoose.model('Seance', SeanceSchema)
