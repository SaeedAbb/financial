<#import "template.ftl" as layout>
<@layout.registrationLayout; section>
    <#if section = "header">
        <#if messageType = 'success'>
            Email Verification Successful
        <#else>
            ${msg("actionTokenErrorTitle")}
        </#if>
    <#elseif section = "form">
        <div id="kc-action-token" style="text-align: center;">
            <#if messageType = 'success'>
                <div style="color: #27ae60; font-size: 64px; margin-bottom: 20px;">
                    ✓
                </div>
                <h2 style="color: #333; margin-bottom: 15px;">Email Verified Successfully!</h2>
                <p style="color: #666; margin-bottom: 30px;">
                    Your email has been verified. You can now login to your account.
                </p>
                
                <a href="http://localhost:4200/auth/login" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin-bottom: 20px;">
                    Continue to Login
                </a>
                
                <p style="color: #666; font-size: 14px;">
                    Redirecting you to login in <span id="countdown">5</span> seconds...
                </p>
                
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
            <#else>
                <div style="color: #e74c3c; font-size: 64px; margin-bottom: 20px;">
                    ⚠
                </div>
                <h2 style="color: #333; margin-bottom: 15px;">Verification Error</h2>
                <#if message?has_content>
                    <p style="color: #666; margin-bottom: 30px;">
                        ${kcSanitize(message.summary)?no_esc}
                    </p>
                </#if>
                
                <a href="http://localhost:4200/auth/login" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    Go to Login
                </a>
            </#if>
        </div>
    </#if>
</@layout.registrationLayout>