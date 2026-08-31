import axios from 'axios';

const verifyCaptcha = async (req, res, next) => {
    const { captchaToken, captchaVerifiedUntil } = req.body || {};

    if (!process.env.RECAPTCHA_SECRET_KEY) {
        return res.status(500).json({
            success: false,
            message: 'CAPTCHA is not configured on the server'
        });
    }

    const bypassExpiry = Number(captchaVerifiedUntil);
    const validBypass = Number.isFinite(bypassExpiry) && bypassExpiry > Date.now();

    if (captchaToken) {
        try {
            const response = await axios.post(
                'https://www.google.com/recaptcha/api/siteverify',
                null,
                {
                    params: {
                        secret: process.env.RECAPTCHA_SECRET_KEY,
                        response: captchaToken
                    }
                }
            );

            if (!response.data?.success) {
                return res.status(400).json({
                    success: false,
                    message: 'CAPTCHA verification failed'
                });
            }

            return next();
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'CAPTCHA verification failed'
            });
        }
    }

    if (validBypass) {
        return next();
    }

    return res.status(400).json({
        success: false,
        message: 'Please complete the CAPTCHA'
    });
};

export default verifyCaptcha;
