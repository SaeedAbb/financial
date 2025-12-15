// Default environment configuration for development
// This file will be replaced in production builds
(function(window) {
  window['env'] = window['env'] || {};

  // Development defaults
  window['env']['apiUrl'] = 'http://localhost:8080/api/v1';
  window['env']['keycloakUrl'] = 'http://localhost:8180';
  window['env']['keycloakRealm'] = 'basis-realm';
  window['env']['keycloakClientId'] = 'basis-frontend';
  window['env']['appUrl'] = 'http://localhost:4200';
  window['env']['swaggerUrl'] = 'http://localhost:8080/swagger-ui.html';
})(this);