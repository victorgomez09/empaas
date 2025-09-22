Here is a guide I wrote for myself copied and pasted from my Notion. This is a setup where you point your cloudflare tunnel to your traefik reverse proxy Cloudflare Tunnel → empaas Reverse Proxy → Service Container. In the guide I have an example empaas service called coder and domain example.io.

HTTPS Setup with Traefik
1: Go to cloudflared and get an Origin Server cert as PEM format
Navigate to your domain (example.io)
Go to SSL/TLS → Origin Server
2: Save Certificate Files on Your Server
Add .crt and .key files to /etc/empaas/traefik/dynamic/certificates
Set permissions
sudo chmod 644 '/etc/empaas/traefik/dynamic/certificates/exampleio.crt'
sudo chmod 600 '/etc/empaas/traefik/dynamic/certificates/exampleio.key'
3: Update Traefik Config
Remove lets encrypt from the main config, we will be using certs from cloudflare
providers:
  swarm:
    exposedByDefault: false
    watch: true
  docker:
    exposedByDefault: false
    watch: true
    network: empaas-network
  file:
    directory: /etc/empaas/traefik/dynamic
    watch: true
entryPoints:
  web:
    address: ':80'
  websecure:
    address: ':443'
    http3:
      advertisedPort: 443
    # http:
    #   tls:
    #     certResolver: letsencrypt
api:
  insecure: true
# # Disabled because I am using cloudflare origin certificates with cloudflared tunnels
# certificatesResolvers:
#   letsencrypt:
#     acme:
#       email: test@localhost.com
#       storage: /etc/empaas/traefik/dynamic/acme.json
#       httpChallenge:
#         entryPoint: web
Create a dynamic config for the new certificates
# /etc/empaas/traefik/dynamic/certificates.yml
tls:
  certificates:
    - certFile: /etc/empaas/traefik/dynamic/certificates/exampleio.crt
      keyFile: /etc/empaas/traefik/dynamic/certificates/exampleio.key
      stores:
        - default
  stores:
    default:
      defaultCertificate:
        certFile: /etc/empaas/traefik/dynamic/certificates/exampleio.crt
        keyFile: /etc/empaas/traefik/dynamic/certificates/exampleio.key
Update middleware
# /etc/empaas/traefik/dynamic/middlewares.yml
http:
  middlewares:
    redirect-to-https:
      redirectScheme:
        scheme: https
        permanent: true
4: Set Service Domain
Add the sub domain to the service in empaas as https
Set Certificate Provider to Custom
Set Custom Certificate Resolver to file
Add the sub domain to cloudflared tunnel online
Hostname Config:
subdomain: coder
domain: example.io
path: none

Service:
type: https 
URL: localhost:443  ← Change from port 80 to 443

Additional application settings:
TLS → Origin Server Name: coder.example.io  ← THIS IS IMPORTANT or get 502 Bad Gateway. THIS MUST ALSO MATCH empaas DOMAIN SETTING
