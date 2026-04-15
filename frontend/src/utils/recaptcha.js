const SITE_KEY = '6LcnsbgsAAAAAOSb-jld4bE3nH0TOOP8mTQd4w6M'

export async function getRecaptchaToken(action = 'submit') {
  return new Promise((resolve) => {
    if (!window.grecaptcha) { resolve(null); return }
    window.grecaptcha.ready(() => {
      window.grecaptcha.execute(SITE_KEY, { action }).then(resolve).catch(() => resolve(null))
    })
  })
}
