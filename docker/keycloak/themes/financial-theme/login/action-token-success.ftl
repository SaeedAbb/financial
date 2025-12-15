<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "header">
        Email Verified Successfully
    <#elseif section = "form">
        <div id="kc-info-message">
            <div style="text-align: center;">
                <div style="color: #27ae60; font-size: 48px; margin-bottom: 20px;">
                    ✓
                </div>
                <h2 style="color: #333; margin-bottom: 15px;">Email Verified!</h2>
                <p style="color: #666; margin-bottom: 30px;">
                    Your email has been successfully verified. You can now access your account.
                </p>
                
                <a href="http://localhost:4200/auth/login" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-bottom: 20px;">
                    Continue to Login
                </a>
                
                <p style="color: #666; font-size: 14px;">
                    You will be redirected automatically in <span id="countdown">5</span> seconds...
                </p>
            </div>
        </div>
        
        <script>
            let countdown = 5;
            const countdownElement = document.getElementById('countdown');
            
            const timer = setInterval(() => {
                countdown--;
                if (countdownElement) {
                    countdownElement.textContent = countdown;
                }
                
                if (countdown <= 0) {
                    clearInterval(timer);
                    window.location.href = 'http://localhost:4200/auth/login';
                }
            }, 1000);
        </script>
    </#if>
</@layout.registrationLayout>