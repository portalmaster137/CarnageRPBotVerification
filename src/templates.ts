export const baseTemplate = (title: string, content: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - CarnageRP Verification</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            color: #333;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            flex: 1;
        }

        header {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            padding: 1rem 0;
            margin-bottom: 2rem;
        }

        .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
        }

        .logo {
            font-size: 1.5rem;
            font-weight: bold;
            color: white;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .logo::before {
            content: "🎮";
            font-size: 1.8rem;
        }

        nav {
            display: flex;
            gap: 1rem;
        }

        nav a {
            color: white;
            text-decoration: none;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            transition: all 0.3s ease;
            background: rgba(255, 255, 255, 0.1);
        }

        nav a:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
        }

        .main-content {
            background: white;
            border-radius: 1rem;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
        }

        h1 {
            color: #333;
            margin-bottom: 1rem;
            font-size: 2.5rem;
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        h2 {
            color: #444;
            margin: 1.5rem 0 1rem 0;
            font-size: 1.5rem;
            border-bottom: 2px solid #667eea;
            padding-bottom: 0.5rem;
        }

        p {
            line-height: 1.6;
            margin-bottom: 1rem;
            color: #666;
        }

        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin: 2rem 0;
        }

        .feature-card {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 1.5rem;
            border-radius: 0.5rem;
            text-align: center;
            transition: transform 0.3s ease;
        }

        .feature-card:hover {
            transform: translateY(-5px);
        }

        .feature-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }

        .feature-title {
            font-size: 1.2rem;
            font-weight: bold;
            color: #333;
            margin-bottom: 0.5rem;
        }

        .feature-description {
            color: #666;
            font-size: 0.9rem;
        }

        .cta-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 0.5rem;
            text-align: center;
            margin: 2rem 0;
        }

        .cta-button {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            padding: 1rem 2rem;
            border-radius: 0.5rem;
            text-decoration: none;
            margin-top: 1rem;
            transition: all 0.3s ease;
            font-weight: bold;
        }

        .cta-button:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }

        .section {
            margin-bottom: 2rem;
        }

        ol, ul {
            margin-left: 1.5rem;
            margin-bottom: 1rem;
        }

        li {
            margin-bottom: 0.5rem;
            color: #666;
        }

        footer {
            background: rgba(0, 0, 0, 0.1);
            color: white;
            text-align: center;
            padding: 1rem 0;
            margin-top: auto;
        }

        @media (max-width: 768px) {
            .header-content {
                flex-direction: column;
                gap: 1rem;
            }

            .main-content {
                padding: 1rem;
            }

            h1 {
                font-size: 2rem;
            }

            .feature-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <div class="header-content">
                <a href="/" class="logo">CarnageRP Verification</a>
                <nav>
                    <a href="/">Home</a>
                    <a href="/privacy">Privacy</a>
                    <a href="/terms">Terms</a>
                </nav>
            </div>
        </div>
    </header>

    <div class="container">
        <main class="main-content">
            ${content}
        </main>
    </div>

    <footer>
        <div class="container">
            <p>&copy; 2025 CarnageRP Verification Bot. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>
`;

export const homePage = (): string => baseTemplate('Home', `
    <h1>Welcome to CarnageRP Verification</h1>
    <div class="section">
        <h2>How It Works</h2>
        <div class="feature-grid">
            <div class="feature-card">
                <div class="feature-icon">🔗</div>
                <div class="feature-title">1. Connect</div>
                <div class="feature-description">Click the verification button in our Communication Server</div>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🛡️</div>
                <div class="feature-title">2. Verify</div>
                <div class="feature-description">Authenticate with your Roblox account securely</div>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🎯</div>
                <div class="feature-title">3. Play</div>
                <div class="feature-description">Receive your role and start playing on CarnageRP</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Features</h2>
        <div class="feature-grid">
            <div class="feature-card">
                <div class="feature-icon">⚡</div>
                <div class="feature-title">Instant Verification</div>
                <div class="feature-description">Quick and seamless authentication process</div>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🔒</div>
                <div class="feature-title">Secure & Private</div>
                <div class="feature-description">Your data is protected with enterprise-grade security</div>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🎪</div>
                <div class="feature-title">Role-Based Access</div>
                <div class="feature-description">Automatic role assignment based on verification status</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>About CarnageRP</h2>
        <p>CarnageRP is a premium Roblox roleplay server that provides an immersive gaming experience. Our verification system ensures a safe and trusted community for all players.</p>
        <p>This bot is designed to streamline the verification process, making it easy for players to prove their identity and gain access to exclusive server features.</p>
    </div>
`);

export const privacyPage = (): string => baseTemplate('Privacy Policy', `
    <h1>Privacy Policy</h1>
    
    <p><strong>Last updated:</strong> ${new Date().toLocaleDateString()}</p>

    <div class="section">
        <h2>Information We Collect</h2>
        <p>The CarnageRP Verification Bot collects minimal data necessary for operation:</p>
        <ul>
            <li><strong>Discord Information:</strong> Your Discord user ID and username</li>
            <li><strong>Roblox Information:</strong> Your Roblox user ID, username, and verification status</li>
            <li><strong>Authentication Data:</strong> Temporary OAuth tokens for the verification process</li>
        </ul>
    </div>

    <div class="section">
        <h2>How We Use Your Information</h2>
        <p>We use the collected information solely for:</p>
        <ul>
            <li>Verifying your identity between Discord and Roblox accounts</li>
            <li>Assigning appropriate roles in the Communication Server</li>
            <li>Maintaining server security and preventing unauthorized access</li>
            <li>Updating your Discord nickname with your Roblox display name</li>
        </ul>
    </div>

    <div class="section">
        <h2>Data Storage and Security</h2>
        <p>We are committed to protecting your privacy:</p>
        <ul>
            <li>We do not store any personal information beyond what is required for verification</li>
            <li>OAuth tokens are temporary and discarded after use</li>
            <li>All data transmission is encrypted using HTTPS</li>
            <li>We implement industry-standard security measures to protect your data</li>
        </ul>
    </div>

    <div class="section">
        <h2>Data Sharing</h2>
        <p>We do not share your personal information with third parties, except:</p>
        <ul>
            <li>With Roblox and Discord APIs for the necessary OAuth2 authentication process</li>
            <li>When required by law or to protect our legal rights</li>
            <li>With your explicit consent for specific purposes</li>
        </ul>
    </div>

    <div class="section">
        <h2>Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
            <li>Request information about what data we have about you</li>
            <li>Request deletion of your data from our systems</li>
            <li>Withdraw consent for data processing at any time</li>
            <li>Report concerns about our data practices</li>
        </ul>
    </div>

    <div class="section">
        <h2>Contact Us</h2>
        <p>If you have any questions about this Privacy Policy or our data practices, please contact us through our Communication Server or the appropriate channels provided by CarnageRP.</p>
        <p>Or send a email to <a href="mailto:portadev.contact@gmail.com">Our Email</a></p>
    </div>
`);

export const tosPage = (): string => baseTemplate('Terms of Service', `
    <h1>Terms of Service</h1>
    
    <p><strong>Last updated:</strong> ${new Date().toLocaleDateString()}</p>

    <div class="section">
        <h2>Acceptance of Terms</h2>
        <p>By using the CarnageRP Verification Bot, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.</p>
    </div>

    <div class="section">
        <h2>Service Description</h2>
        <p>The CarnageRP Verification Bot is a Discord bot that facilitates account verification between Discord and Roblox platforms to provide secure access to the CarnageRP server community.</p>
    </div>

    <div class="section">
        <h2>User Requirements</h2>
        <p>To use this service, you must:</p>
        <ol>
            <li>Have a valid Discord account in good standing</li>
            <li>Have a valid Roblox account</li>
            <li>Be authorized to use both accounts</li>
            <li>Comply with all applicable laws and regulations</li>
            <li>Be at least 13 years old (or the minimum age in your jurisdiction)</li>
        </ol>
    </div>

    <div class="section">
        <h2>Prohibited Uses</h2>
        <p>You agree not to use the bot for any unlawful or prohibited purposes, including but not limited to:</p>
        <ul>
            <li>Attempting to verify accounts that do not belong to you</li>
            <li>Using the bot to gain unauthorized access to servers or systems</li>
            <li>Interfering with the bot's operation or attempting to reverse engineer it</li>
            <li>Violating Discord's Terms of Service or Community Guidelines</li>
            <li>Violating Roblox's Terms of Service or Community Standards</li>
            <li>Engaging in fraudulent activities or impersonation</li>
        </ul>
    </div>

    <div class="section">
        <h2>Role Assignment</h2>
        <p>The bot automatically assigns roles based on your Roblox account verification status:</p>
        <ul>
            <li>Verified Roblox accounts receive enhanced privileges</li>
            <li>Unverified accounts receive basic access</li>
            <li>Role assignments are subject to change based on verification status</li>
        </ul>
    </div>

    <div class="section">
        <h2>Service Availability</h2>
        <p>We strive to maintain high availability, but:</p>
        <ul>
            <li>The service is provided "as is" without warranties or guarantees</li>
            <li>We may experience temporary downtime for maintenance or updates</li>
            <li>We reserve the right to modify or discontinue the service at any time</li>
        </ul>
    </div>

    <div class="section">
        <h2>Account Termination</h2>
        <p>We reserve the right to:</p>
        <ul>
            <li>Revoke access at any time if we detect misuse</li>
            <li>Remove roles or privileges for violations of these terms</li>
            <li>Ban users who repeatedly violate our policies</li>
        </ul>
    </div>

    <div class="section">
        <h2>Limitation of Liability</h2>
        <p>To the fullest extent permitted by law:</p>
        <ul>
            <li>We are not liable for any indirect, incidental, or consequential damages</li>
            <li>Our liability is limited to the maximum extent permitted by law</li>
            <li>You use the service at your own risk</li>
        </ul>
    </div>

    <div class="section">
        <h2>Changes to Terms</h2>
        <p>We may update these Terms of Service from time to time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
    </div>

    <div class="section">
        <h2>Governing Law</h2>
        <p>These terms are governed by the laws of the jurisdiction where the service is operated, without regard to conflict of law principles.</p>
    </div>

    <div class="section">
        <h2>Contact Information</h2>
        <p>For questions about these Terms of Service, please contact us through the appropriate channels provided by CarnageRP or our Communication Server.</p>
    </div>
`);