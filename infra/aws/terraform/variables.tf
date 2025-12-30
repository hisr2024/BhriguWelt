variable "aws_region" {
  type        = string
  description = "AWS region for shared resources"
  default     = "us-east-1"
}

variable "api_gateway_domain_name" {
  type        = string
  description = "API Gateway domain name for the primary Lambda-backed API (no protocol)"
}

variable "vercel_domain_name" {
  type        = string
  description = "Vercel deployment domain name used as the secondary origin (no protocol)"
}
