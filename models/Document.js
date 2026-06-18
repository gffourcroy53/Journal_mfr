import mongoose from 'mongoose'

const DocPedaSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  type: {
    type: String,
    enum: ['fiche_tp', 'cours', 'corrige', 'evaluation', 'grille_ccf', 'support_video', 'autre'],
    default: 'fiche_tp'
  },
  classes: [{ type: String }],
  module: { type: String, default: '' },
  matiere: { type: String, default: '' },
  fichier_url: { type: String, default: '' },
  description: { type: String, default: '' },
  tags: [{ type: String }],
  date_creation: { type: String, default: '' },
}, { timestamps: true })

DocPedaSchema.index({ module: 1 })
DocPedaSchema.index({ classes: 1 })
DocPedaSchema.index({ tags: 1 })

export default mongoose.models.DocPeda || mongoose.model('DocPeda', DocPedaSchema)
