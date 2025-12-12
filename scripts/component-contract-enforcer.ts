#!/usr/bin/env ts-node

/**
 * Component Contract Enforcer Script
 * 
 * Ensures API consistency between web and mobile components
 * 
 * Usage:
 *   ts-node scripts/component-contract-enforcer.ts [--component <name>] [--generate-contracts]
 */

import * as fs from 'fs';
import * as path from 'path';

interface ComponentContract {
  name: string;
  props: {
    required: Array<{ name: string; type: string }>;
    optional: Array<{ name: string; type: string; default?: string }>;
  };
  variants: {
    size?: string[];
    variant?: string[];
    intent?: string[];
  };
  events: Array<{ name: string; signature: string }>;
  accessibility: string[];
}

interface ContractMismatch {
  component: string;
  type: 'missing-prop' | 'type-mismatch' | 'missing-variant' | 'missing-event' | 'naming';
  platform: 'web' | 'mobile';
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  fix?: string;
}

class ComponentContractEnforcer {
  private mismatches: ContractMismatch[] = [];

  /**
   * Extract component props from TypeScript file
   */
  private extractProps(filePath: string): ComponentContract | null {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const componentName = path.basename(filePath, '.tsx');

    // Extract interface/type definition
    const interfaceMatch = content.match(/export\s+interface\s+(\w+Props)\s*\{([\s\S]*?)\}/);
    if (!interfaceMatch) {
      return null;
    }

    const propsContent = interfaceMatch[2];
    const props: ComponentContract = {
      name: componentName,
      props: { required: [], optional: [] },
      variants: {},
      events: [],
      accessibility: [],
    };

    // Parse props
    const propLines = propsContent.split('\n');
    propLines.forEach(line => {
      const propMatch = line.match(/(\w+)(\?)?:\s*([^;]+)/);
      if (propMatch) {
        const [, name, optional, type] = propMatch;
        const prop = { name, type: type.trim() };
        
        if (optional) {
          props.props.optional.push(prop);
        } else {
          props.props.required.push(prop);
        }
      }
    });

    // Extract variants from cva
    const cvaMatch = content.match(/cva\([^,]+,\s*\{[\s\S]*?variants:\s*\{([\s\S]*?)\}/);
    if (cvaMatch) {
      const variantsContent = cvaMatch[1];
      
      // Extract size variants
      const sizeMatch = variantsContent.match(/size:\s*\{([\s\S]*?)\}/);
      if (sizeMatch) {
        const sizes = sizeMatch[1].match(/(\w+):/g)?.map(s => s.replace(':', '')) || [];
        props.variants.size = sizes;
      }

      // Extract variant options
      const variantMatch = variantsContent.match(/variant:\s*\{([\s\S]*?)\}/);
      if (variantMatch) {
        const variants = variantMatch[1].match(/(\w+):/g)?.map(v => v.replace(':', '')) || [];
        props.variants.variant = variants;
      }
    }

    // Extract event handlers
    const eventHandlers = ['onClick', 'onChange', 'onSubmit', 'onFocus', 'onBlur'];
    eventHandlers.forEach(handler => {
      if (content.includes(`${handler}?:`)) {
        props.events.push({ name: handler, signature: 'React event handler' });
      }
    });

    // Extract accessibility props
    const ariaProps = content.match(/aria-\w+/g) || [];
    props.accessibility = [...new Set(ariaProps)];

    return props;
  }

  /**
   * Compare web and mobile component contracts
   */
  public compareContracts(componentName: string): ContractMismatch[] {
    this.mismatches = [];

    const webPath = path.join(process.cwd(), `packages/ui/components/${componentName}.tsx`);
    const mobilePath = path.join(process.cwd(), `apps/mobile/src/components/${componentName}.tsx`);

    const webContract = this.extractProps(webPath);
    const mobileContract = this.extractProps(mobilePath);

    if (!webContract && !mobileContract) {
      throw new Error(`Component ${componentName} not found in web or mobile`);
    }

    if (!webContract) {
      this.mismatches.push({
        component: componentName,
        type: 'missing-prop',
        platform: 'web',
        severity: 'critical',
        message: `Component ${componentName} missing in web`,
      });
      return this.mismatches;
    }

    if (!mobileContract) {
      this.mismatches.push({
        component: componentName,
        type: 'missing-prop',
        platform: 'mobile',
        severity: 'critical',
        message: `Component ${componentName} missing in mobile`,
      });
      return this.mismatches;
    }

    // Compare props
    this.compareProps(webContract, mobileContract, componentName);

    // Compare variants
    this.compareVariants(webContract, mobileContract, componentName);

    // Compare events
    this.compareEvents(webContract, mobileContract, componentName);

    // Compare accessibility
    this.compareAccessibility(webContract, mobileContract, componentName);

    return this.mismatches;
  }

  private compareProps(web: ComponentContract, mobile: ComponentContract, name: string): void {
    const webProps = new Set([...web.props.required, ...web.props.optional].map(p => p.name));
    const mobileProps = new Set([...mobile.props.required, ...mobile.props.optional].map(p => p.name));

    // Check for missing props in mobile
    webProps.forEach(prop => {
      if (!mobileProps.has(prop)) {
        this.mismatches.push({
          component: name,
          type: 'missing-prop',
          platform: 'mobile',
          severity: 'high',
          message: `Prop '${prop}' exists in web but missing in mobile`,
          fix: `Add ${prop} prop to mobile component`,
        });
      }
    });

    // Check for missing props in web
    mobileProps.forEach(prop => {
      if (!webProps.has(prop)) {
        this.mismatches.push({
          component: name,
          type: 'missing-prop',
          platform: 'web',
          severity: 'high',
          message: `Prop '${prop}' exists in mobile but missing in web`,
          fix: `Add ${prop} prop to web component`,
        });
      }
    });
  }

  private compareVariants(web: ComponentContract, mobile: ComponentContract, name: string): void {
    const webVariants = web.variants.variant || [];
    const mobileVariants = mobile.variants.variant || [];

    webVariants.forEach(variant => {
      if (!mobileVariants.includes(variant)) {
        this.mismatches.push({
          component: name,
          type: 'missing-variant',
          platform: 'mobile',
          severity: 'medium',
          message: `Variant '${variant}' exists in web but missing in mobile`,
        });
      }
    });
  }

  private compareEvents(web: ComponentContract, mobile: ComponentContract, name: string): void {
    const webEvents = new Set(web.events.map(e => e.name));
    const mobileEvents = new Set(mobile.events.map(e => e.name));

    webEvents.forEach(event => {
      if (!mobileEvents.has(event)) {
        this.mismatches.push({
          component: name,
          type: 'missing-event',
          platform: 'mobile',
          severity: 'medium',
          message: `Event handler '${event}' exists in web but missing in mobile`,
        });
      }
    });
  }

  private compareAccessibility(web: ComponentContract, mobile: ComponentContract, name: string): void {
    const webAria = new Set(web.accessibility);
    const mobileAria = new Set(mobile.accessibility);

    webAria.forEach(aria => {
      if (!mobileAria.has(aria)) {
        this.mismatches.push({
          component: name,
          type: 'missing-prop',
          platform: 'mobile',
          severity: 'high',
          message: `Accessibility prop '${aria}' exists in web but missing in mobile`,
        });
      }
    });
  }

  /**
   * Generate contract definition file
   */
  public generateContract(componentName: string, webContract: ComponentContract): string {
    const requiredProps = webContract.props.required.map(p => `  ${p.name}: ${p.type};`).join('\n');
    const optionalProps = webContract.props.optional.map(p => `  ${p.name}?: ${p.type};`).join('\n');
    const variants = webContract.variants.variant?.join(" | ") || 'string';
    const sizes = webContract.variants.size?.join(" | ") || 'string';

    return `/**
 * ${componentName} Component Contract
 * 
 * Shared contract definition for web and mobile implementations
 * Auto-generated by Component Contract Enforcer
 * 
 * Last updated: ${new Date().toISOString()}
 */

export interface ${componentName}Props {
${requiredProps}
${optionalProps ? '\n' + optionalProps : ''}
}

export type ${componentName}Variant = ${variants};
export type ${componentName}Size = ${sizes};

export interface ${componentName}Events {
${webContract.events.map(e => `  ${e.name}: ${e.signature};`).join('\n')}
}

export const ${componentName}Accessibility = {
${webContract.accessibility.map(a => `  ${a}: true,`).join('\n')}
} as const;
`;
  }

  /**
   * Generate report
   */
  public generateReport(componentName: string, mismatches: ContractMismatch[]): string {
    let md = `# 🔒 Component Contract Report: ${componentName}\n\n`;
    md += `**Generated:** ${new Date().toISOString()}\n\n`;

    const critical = mismatches.filter(m => m.severity === 'critical').length;
    const high = mismatches.filter(m => m.severity === 'high').length;
    const medium = mismatches.filter(m => m.severity === 'medium').length;
    const low = mismatches.filter(m => m.severity === 'low').length;

    md += `## 📊 Summary\n\n`;
    md += `- **Total Mismatches:** ${mismatches.length}\n`;
    md += `- **Critical:** ${critical}\n`;
    md += `- **High:** ${high}\n`;
    md += `- **Medium:** ${medium}\n`;
    md += `- **Low:** ${low}\n\n`;

    if (mismatches.length === 0) {
      md += `## ✅ No Mismatches Found\n\n`;
      md += `Web and mobile components have consistent APIs.\n`;
      return md;
    }

    md += `## 💥 Mismatches\n\n`;

    mismatches.forEach(m => {
      const icon = m.severity === 'critical' ? '🔴' : 
                  m.severity === 'high' ? '🟠' : 
                  m.severity === 'medium' ? '🟡' : '🟢';
      
      md += `${icon} **${m.severity.toUpperCase()}** - ${m.type}\n`;
      md += `   - Platform: ${m.platform}\n`;
      md += `   - Message: ${m.message}\n`;
      if (m.fix) md += `   - Fix: ${m.fix}\n`;
      md += `\n`;
    });

    return md;
  }
}

// CLI
const args = process.argv.slice(2);
const componentIndex = args.indexOf('--component');
const componentName = componentIndex >= 0 && args[componentIndex + 1]
  ? args[componentIndex + 1]
  : 'Button';

const enforcer = new ComponentContractEnforcer();
const mismatches = enforcer.compareContracts(componentName);
const report = enforcer.generateReport(componentName, mismatches);

console.log(report);

// Write report
const reportPath = path.join(process.cwd(), `CONTRACT_REPORT_${componentName}.md`);
fs.writeFileSync(reportPath, report, 'utf-8');
console.log(`\n📄 Report written to: ${reportPath}`);

// Generate contract if requested
if (args.includes('--generate-contracts')) {
  const webPath = path.join(process.cwd(), `packages/ui/components/${componentName}.tsx`);
  const webContract = enforcer.extractProps(webPath);
  
  if (webContract) {
    const contractContent = enforcer.generateContract(componentName, webContract);
    const contractPath = path.join(process.cwd(), `packages/core/ui-contracts/${componentName}.types.ts`);
    
    // Ensure directory exists
    const contractDir = path.dirname(contractPath);
    if (!fs.existsSync(contractDir)) {
      fs.mkdirSync(contractDir, { recursive: true });
    }
    
    fs.writeFileSync(contractPath, contractContent, 'utf-8');
    console.log(`✅ Contract definition written to: ${contractPath}`);
  }
}
