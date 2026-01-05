<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #FF5500 0%, #ff7700 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .logo {
            font-size: 48px;
            color: #ffffff;
            margin-bottom: 10px;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
        }
        .content h2 {
            color: #333333;
            font-size: 22px;
            margin-top: 0;
            margin-bottom: 20px;
        }
        .content p {
            color: #666666;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        .button {
            display: inline-block;
            padding: 15px 40px;
            background-color: #FF5500;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
            margin: 20px 0;
            transition: background-color 0.3s;
        }
        .button:hover {
            background-color: #ff7700;
        }
        .alternative-link {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            word-break: break-all;
            font-size: 12px;
            color: #666666;
            margin: 20px 0;
        }
        .footer {
            background-color: #f9f9f9;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #eeeeee;
        }
        .footer p {
            color: #999999;
            font-size: 12px;
            margin: 5px 0;
        }
        .divider {
            height: 1px;
            background-color: #eeeeee;
            margin: 30px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🕌</div>
            <h1>Islamic Soundcloud</h1>
        </div>
        
        <div class="content">
            <h2>Welcome, {{ $userName }}!</h2>
            
            <p>Thank you for registering with Islamic Soundcloud. We're excited to have you join our community of believers sharing Islamic content.</p>
            
            <p>To complete your registration and start enjoying our platform, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
                <a href="{{ $verificationUrl }}" class="button">Verify Email Address</a>
            </div>
            
            <p>This verification link will expire in 24 hours for security reasons.</p>
            
            <div class="divider"></div>
            
            <p style="font-size: 14px; color: #999999;">If the button doesn't work, copy and paste this link into your browser:</p>
            <div class="alternative-link">{{ $verificationUrl }}</div>
            
            <div class="divider"></div>
            
            <p style="font-size: 13px; color: #999999;">If you didn't create an account with Islamic Soundcloud, you can safely ignore this email.</p>
        </div>
        
        <div class="footer">
            <p>© {{ date('Y') }} Islamic Soundcloud. All rights reserved.</p>
            <p>Listen to Quran, Nasheeds, and Islamic content from around the world</p>
        </div>
    </div>
</body>
</html>

