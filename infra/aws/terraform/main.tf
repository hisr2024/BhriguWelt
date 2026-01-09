terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_cloudfront_origin_access_control" "bhriguwelt" {
  name                              = "bhriguwelt-origin-oac"
  description                       = "OAC for BhriguWelt origins"
  origin_access_control_origin_type = "custom"
  signing_behavior                  = "no-override"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "bhriguwelt" {
  enabled             = true
  comment             = "BhriguWelt load balancing + failover"
  default_root_object = ""

  origin {
    domain_name = var.api_gateway_domain_name
    origin_id   = "primary-api"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  origin {
    domain_name = var.vercel_domain_name
    origin_id   = "secondary-vercel"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  origin_group {
    origin_id = "bhriguwelt-failover-group"

    failover_criteria {
      status_codes = [500, 502, 503, 504]
    }

    member {
      origin_id = "primary-api"
    }

    member {
      origin_id = "secondary-vercel"
    }
  }

  default_cache_behavior {
    target_origin_id       = "bhriguwelt-failover-group"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]

    forwarded_values {
      query_string = true
      headers      = [
        "Authorization",
        "Content-Type",
        "X-Client-Online",
        "X-AI-Consent",
        "X-AI-Mode",
        "X-Uncompressed-Content-Length",
        "Content-Encoding",
        "X-API-Key",
        "X-Request-ID",
        "X-Correlation-ID",
        "Accept",
        "Origin",
        "X-Requested-With",
        "Access-Control-Request-Headers",
        "Access-Control-Request-Method"
      ]

      cookies {
        forward = "all"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
