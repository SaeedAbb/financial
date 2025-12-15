<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "header">
        Email Verification
    <#elseif section = "form">
        <div id="kc-info-message">
            <p class="instruction">
                <#if messageType = 'success'>
                    <#if message?has_content>
                        ${kcSanitize(message.summary)?no_esc}
                    <#else>
                        Your email has been verified successfully!
                    </#if>
                    
                    <script>
                        // Redirect to application after 3 seconds
                        setTimeout(function() {
                            window.location.href = 'http://localhost:4200/dashboard';
                        }, 3000);
                    </script>
                    
                    <p style="margin-top: 20px;">
                        <a href="http://localhost:4200/dashboard" class="btn btn-primary" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                            Continue to Application
                        </a>
                    </p>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 15px;">
                        You will be redirected automatically in 3 seconds...
                    </p>
                <#else>
                    <#if message?has_content>
                        ${kcSanitize(message.summary)?no_esc}
                    </#if>
                    
                    <p style="margin-top: 20px;">
                        <a href="http://localhost:4200/auth/login" class="btn btn-primary" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                            Go to Login
                        </a>
                    </p>
                </#if>
            </p>
        </div>
    </#if>
</@layout.registrationLayout>