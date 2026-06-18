import mongoose from 'mongoose'

const DocumentSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  type: {
    type: String,
    enum: ['fiche_tp', 'cours', 'corrige', 'evaluation', 'grille_ccf', 'support_video', 'autre'],
    default: 'fiche_tp'
  },
  classes: [{ type: String }], // peut concerner plusieurs classes
  module: { type: String, default: '' },
  matiere: { type: String, default: '' },
  fichier_url: { type: String, default: '' }, // Drive ou Cloudinary
  description: { type: String, default: '' },
  tags: [{ type: String }],
  date_creation: { type: String, default: '' },
}, { timestamps: true })

DocumentSchema.index({ module: 1 })
DocumentSchema.index({ classes: 1 })
DocumentSchema.index({ tags: 1 })

export default mongoose.models.Document || mongoose.model('Document', DocumentSchema)
