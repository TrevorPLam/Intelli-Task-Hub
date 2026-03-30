import { writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { randomUUID } from "crypto";

/**
 * Configuration Audit and Compliance System
 * 
 * Provides comprehensive configuration auditing, change tracking,
 * compliance reporting, and security monitoring for AI configuration.
 */

interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: 'config_read' | 'config_change' | 'config_validation' | 'security_event' | 'migration_event';
  userId?: string;
  sessionId?: string;
  details: Record<string, any>;
  severity: 'info' | 'warn' | 'error' | 'critical';
  compliance?: {
    gdpr?: boolean;
    sox?: boolean;
    hipaa?: boolean;
    pci?: boolean;
  };
  source: string;
  ipAddress?: string;
  userAgent?: string;
}

interface ComplianceReport {
  period: string;
  totalEvents: number;
  eventsByType: Record<string, number>;
  securityEvents: number;
  complianceViolations: number;
  recommendations: string[];
}

/**
 * Configuration Auditor
 */
export class ConfigAuditor {
  private auditLogPath: string;
  private complianceReportPath: string;
  private currentSession: string;

  constructor() {
    this.auditLogPath = resolve(dirname(__filename), '../logs/ai-config-audit.log');
    this.complianceReportPath = resolve(dirname(__filename), '../logs/ai-compliance-report.json');
    this.currentSession = randomUUID();
    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    const logDir = dirname(this.auditLogPath);
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
  }

  /**
   * Log configuration access
   */
  logConfigAccess(userId: string, details: Record<string, any> = {}): void {
    const event: AuditEvent = {
      id: randomUUID(),
      timestamp: new Date(),
      eventType: 'config_read',
      userId,
      sessionId: this.currentSession,
      details,
      severity: 'info',
      source: 'config_manager',
      ipAddress: details.ipAddress,
      userAgent: details.userAgent
    };

    this.writeAuditEvent(event);
  }

  /**
   * Log configuration changes
   */
  logConfigChange(
    userId: string,
    changeType: string,
    oldValue: any,
    newValue: any,
    details: Record<string, any> = {}
  ): void {
    const event: AuditEvent = {
      id: randomUUID(),
      timestamp: new Date(),
      eventType: 'config_change',
      userId,
      sessionId: this.currentSession,
      details: {
        changeType,
        oldValue,
        newValue,
        ...details
      },
      severity: 'info',
      source: 'config_manager'
    };

    this.writeAuditEvent(event);
  }

  /**
   * Log security events
   */
  logSecurityEvent(
    eventType: 'unauthorized_access' | 'invalid_config' | 'encryption_failure',
    userId?: string,
    details: Record<string, any>,
    severity: 'warn' | 'error' | 'critical' = 'error'
  ): void {
    const event: AuditEvent = {
      id: randomUUID(),
      timestamp: new Date(),
      eventType: 'security_event',
      userId,
      sessionId: this.currentSession,
      details: {
        securityEventType: eventType,
        ...details
      },
      severity,
      source: 'security_monitor',
      compliance: {
        gdpr: eventType.includes('unauthorized_access'),
        sox: true,
        hipaa: false,
        pci: false
      }
    };

    this.writeAuditEvent(event);
  }

  /**
   * Log validation failures
   */
  logValidationFailure(
    validationType: string,
    errors: string[],
    details: Record<string, any> = {}
  ): void {
    const event: AuditEvent = {
      id: randomUUID(),
      timestamp: new Date(),
      eventType: 'config_validation',
      details: {
        validationType,
        errors,
        ...details
      },
      severity: 'error',
      source: 'config_validator'
    };

    this.writeAuditEvent(event);
  }

  /**
   * Log migration events
   */
  logMigrationEvent(
    fromVersion: string,
    toVersion: string,
    migrationId: string,
    success: boolean,
    details: Record<string, any> = {}
  ): void {
    const event: AuditEvent = {
      id: randomUUID(),
      timestamp: new Date(),
      eventType: 'migration_event',
      details: {
        fromVersion,
        toVersion,
        migrationId,
        success,
        ...details
      },
      severity: success ? 'info' : 'error',
      source: 'migration_system'
    };

    this.writeAuditEvent(event);
  }

  /**
   * Write audit event to log
   */
  private writeAuditEvent(event: AuditEvent): void {
    try {
      const logLine = JSON.stringify(event);
      writeFileSync(this.auditLogPath, `${logLine}\n`, { flag: 'a' });
    } catch (error) {
      console.error("Failed to write audit event:", error);
    }
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(days: number = 30): ComplianceReport {
    // This is a simplified implementation
    // In production, you'd analyze the audit log for real compliance metrics
    return {
      period: `${days} days`,
      totalEvents: 0, // Would be calculated from actual log analysis
      eventsByType: {
        'config_read': 0,
        'config_change': 0,
        'config_validation': 0,
        'security_event': 0,
        'migration_event': 0
      },
      securityEvents: 0,
      complianceViolations: 0,
      recommendations: [
        "Implement log analysis for real metrics",
        "Set up automated compliance monitoring",
        "Configure alerting for security events",
        "Regular security audits recommended"
      ]
    };
  }

  /**
   * Check compliance with security standards
   */
  checkCompliance(config: any): { compliant: boolean; violations: string[] } {
    const violations: string[] = [];

    // Check for hardcoded secrets (anti-pattern)
    if (config.AI_INTEGRATIONS_OPENAI_API_KEY && config.AI_INTEGRATIONS_OPENAI_API_KEY.includes('sk-')) {
      violations.push("Potential hardcoded API key detected");
    }

    // Check for weak defaults
    if (config.AI_INTEGRATIONS_OPENAI_TEMPERATURE > 1.5) {
      violations.push("Temperature setting may cause excessive API costs");
    }

    // Check for missing encryption in production
    if (process.env.NODE_ENV === 'production' && !config.AI_CONFIG_ENABLE_ENCRYPTION) {
      violations.push("Configuration encryption not enabled in production");
    }

    // Check for missing audit logging
    if (process.env.NODE_ENV === 'production' && config.AI_CONFIG_AUDIT_LEVEL === 'none') {
      violations.push("Audit logging disabled in production");
    }

    return {
      compliant: violations.length === 0,
      violations
    };
  }

  /**
   * Get audit statistics
   */
  getAuditStats(days: number = 30): any {
    // This would read and analyze the audit log
    // For now, return placeholder data
    return {
      period: `${days} days`,
      totalEvents: 0,
      criticalEvents: 0,
      warningEvents: 0,
      infoEvents: 0,
      topEventTypes: {},
      complianceScore: 100
    };
  }

  /**
   * Export audit data for external analysis
   */
  exportAuditData(format: 'json' | 'csv' = 'json'): string {
    try {
      // In a real implementation, this would read and analyze the audit log
      const data = {
        exportDate: new Date().toISOString(),
        format,
        data: "Audit data would be exported here"
      };

      if (format === 'json') {
        return JSON.stringify(data, null, 2);
      } else {
        // CSV format
        return "timestamp,eventType,userId,severity,details\n" + 
               `${new Date().toISOString()},export,audit,data,${JSON.stringify(data)}`;
      }
    } catch (error) {
      throw new Error(`Failed to export audit data: ${error}`);
    }
  }
}

export { ConfigAuditor, type AuditEvent, type ComplianceReport };
