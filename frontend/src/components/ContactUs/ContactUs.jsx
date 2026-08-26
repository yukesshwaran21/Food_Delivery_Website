import { useContext, useRef, useState } from 'react'
import './ContactUs.css'
import axios from 'axios'
import { StoreContext } from '../context/StoreContext'
import { useToast } from '../Toast/ToastContext'

const initialForm = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: ''
}

const maxFileSize = 5 * 1024 * 1024
const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const allowedFileExtensions = /\.(pdf|jpe?g|png|docx?)$/i

const ContactUs = () => {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [attachment, setAttachment] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const fileInputRef = useRef(null)
  const { url } = useContext(StoreContext)
  const { showToast } = useToast()

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
    setErrors((currentErrors) => ({ ...currentErrors, [name]: '' }))
    setSubmitted(false)
  }

  const validate = () => {
    const nextErrors = {}
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phonePattern = /^[+\d][\d\s().-]{7,}$/

    if (!form.name.trim()) nextErrors.name = 'Please enter your full name.'
    if (!emailPattern.test(form.email.trim())) nextErrors.email = 'Please enter a valid email address.'
    if (!phonePattern.test(form.phone.trim())) nextErrors.phone = 'Please enter a valid phone number.'
    if (!form.subject.trim()) nextErrors.subject = 'Please enter a subject.'
    if (!form.message.trim()) nextErrors.message = 'Please enter a message.'
    if (attachment && attachment.size > maxFileSize) nextErrors.attachment = 'File size must be less than 5 MB.'
    if (attachment && (!allowedFileTypes.includes(attachment.type) || !allowedFileExtensions.test(attachment.name))) nextErrors.attachment = 'Please upload a valid file.'

    return nextErrors
  }

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0]
    setAttachment(selectedFile || null)
    let attachmentError = ''
    if (selectedFile && selectedFile.size > maxFileSize) attachmentError = 'File size must be less than 5 MB.'
    if (selectedFile && (!allowedFileTypes.includes(selectedFile.type) || !allowedFileExtensions.test(selectedFile.name))) attachmentError = 'Please upload a valid file.'
    setErrors((currentErrors) => ({ ...currentErrors, attachment: attachmentError }))
    setSubmitted(false)
  }

  const removeAttachment = () => {
    setAttachment(null)
    setErrors((currentErrors) => ({ ...currentErrors, attachment: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate()

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setSubmitted(false)
      return
    }

    setErrors({})
    setIsSending(true)

    const formData = new FormData()
    formData.append('fullName', form.name.trim())
    formData.append('email', form.email.trim())
    formData.append('phone', form.phone.trim())
    formData.append('subject', form.subject.trim())
    formData.append('message', form.message.trim())
    if (attachment) formData.append('attachment', attachment)

    try {
      const response = await axios.post(`${url}/api/contact/submit`, formData)
      if (!response.data.success) throw new Error(response.data.message)

      setForm(initialForm)
      removeAttachment()
      setSubmitted(true)
      showToast('Thank you! Your message has been sent successfully.')
    } catch (error) {
      showToast('Unable to send your message. Please try again.', 'error')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section className="contact-section" id="contact">
      <div className="contact-container">
        <div className="contact-intro">
          <p className="contact-eyebrow">We are here to help</p>
          <h2>Contact <span className="accent-text">Us</span></h2>
          <p>Have a question about your order or want to share feedback? Send us a message and our team will get back to you.</p>
        </div>

        {submitted && (
          <p className="contact-success" role="status">Thank you! Your message has been sent successfully.</p>
        )}

        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          <div className="contact-form-grid">
            <div className="contact-field">
              <label htmlFor="contact-name">Full Name</label>
              <input id="contact-name" name="name" type="text" value={form.name} onChange={handleChange} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'contact-name-error' : undefined} />
              {errors.name && <span id="contact-name-error" className="contact-error">{errors.name}</span>}
            </div>
            <div className="contact-field">
              <label htmlFor="contact-email">Email Address</label>
              <input id="contact-email" name="email" type="email" value={form.email} onChange={handleChange} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'contact-email-error' : undefined} />
              {errors.email && <span id="contact-email-error" className="contact-error">{errors.email}</span>}
            </div>
            <div className="contact-field">
              <label htmlFor="contact-phone">Phone Number</label>
              <input id="contact-phone" name="phone" type="tel" value={form.phone} onChange={handleChange} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'contact-phone-error' : undefined} />
              {errors.phone && <span id="contact-phone-error" className="contact-error">{errors.phone}</span>}
            </div>
            <div className="contact-field">
              <label htmlFor="contact-subject">Subject</label>
              <input id="contact-subject" name="subject" type="text" value={form.subject} onChange={handleChange} aria-invalid={Boolean(errors.subject)} aria-describedby={errors.subject ? 'contact-subject-error' : undefined} />
              {errors.subject && <span id="contact-subject-error" className="contact-error">{errors.subject}</span>}
            </div>
          </div>
          <div className="contact-field">
            <label htmlFor="contact-message">Message</label>
            <textarea id="contact-message" name="message" rows="6" value={form.message} onChange={handleChange} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'contact-message-error' : undefined} />
            {errors.message && <span id="contact-message-error" className="contact-error">{errors.message}</span>}
          </div>
          <div className="contact-field contact-attachment-field">
            <label htmlFor="contact-attachment">Attachment <span>(optional)</span></label>
            <div className={`contact-file-input ${errors.attachment ? 'has-error' : ''}`}>
              <label className="contact-file-button" htmlFor="contact-attachment">Choose File</label>
              <input ref={fileInputRef} id="contact-attachment" type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileChange} aria-invalid={Boolean(errors.attachment)} aria-describedby={errors.attachment ? 'contact-attachment-error' : 'contact-attachment-help'} />
              <span className="contact-file-name">{attachment ? attachment.name : 'No file selected'}</span>
              {attachment && <button type="button" className="contact-file-remove" onClick={removeAttachment} aria-label="Remove attachment">×</button>}
            </div>
            {errors.attachment ? <span id="contact-attachment-error" className="contact-error">{errors.attachment}</span> : <span id="contact-attachment-help" className="contact-file-help">PDF, JPG, PNG, DOC, DOCX. Maximum 5 MB.</span>}
          </div>
          <button className="contact-submit" type="submit" disabled={isSending}>{isSending ? 'Sending...' : 'Send Message'}</button>
        </form>
      </div>
    </section>
  )
}

export default ContactUs
