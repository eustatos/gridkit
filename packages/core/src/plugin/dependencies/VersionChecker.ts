// VersionChecker.ts - Semantic version checking

/**
 * Version comparison result
 */
export enum VersionComparison {
  /** The first version is less than the second */
  Less = -1,
  /** The versions are equal */
  Equal = 0,
  /** The first version is greater than the second */
  Greater = 1
}

/**
 * Semantic version
 */
export interface SemanticVersion {
  /** Major version number */
  major: number;
  /** Minor version number */
  minor: number;
  /** Patch version number */
  patch: number;
  /** Pre-release identifier */
  preRelease?: string;
  /** Build metadata */
  build?: string;
}

/**
 * Version checker for semantic version checking
 */
export class VersionChecker {
  /**
   * Parses a semantic version string
   * @param version - The version string to parse
   * @returns The parsed semantic version
   * @throws Error if the version string is invalid
   */
  static parse(version: string): SemanticVersion {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/);
    
    if (!match) {
      throw new Error(`Invalid semantic version: ${version}`);
    }
    
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      preRelease: match[4],
      build: match[5]
    };
  }

  /**
   * Compares two semantic versions
   * @param v1 - The first version to compare
   * @param v2 - The second version to compare
   * @returns The comparison result
   */
  static compare(v1: string | SemanticVersion, v2: string | SemanticVersion): VersionComparison {
    const version1 = typeof v1 === 'string' ? this.parse(v1) : v1;
    const version2 = typeof v2 === 'string' ? this.parse(v2) : v2;
    
    // Compare major versions
    if (version1.major < version2.major) return VersionComparison.Less;
    if (version1.major > version2.major) return VersionComparison.Greater;
    
    // Compare minor versions
    if (version1.minor < version2.minor) return VersionComparison.Less;
    if (version1.minor > version2.minor) return VersionComparison.Greater;
    
    // Compare patch versions
    if (version1.patch < version2.patch) return VersionComparison.Less;
    if (version1.patch > version2.patch) return VersionComparison.Greater;
    
    // Compare pre-release versions
    if (version1.preRelease && !version2.preRelease) return VersionComparison.Less;
    if (!version1.preRelease && version2.preRelease) return VersionComparison.Greater;
    if (version1.preRelease && version2.preRelease) {
      if (version1.preRelease < version2.preRelease) return VersionComparison.Less;
      if (version1.preRelease > version2.preRelease) return VersionComparison.Greater;
    }
    
    // Versions are equal
    return VersionComparison.Equal;
  }

  /**
   * Checks if a version satisfies a version range
   * @param version - The version to check
   * @param range - The version range to check against
   * @returns true if the version satisfies the range, false otherwise
   */
  static satisfies(version: string, range: string): boolean {
    // Simple implementation that only supports exact version matching
    // A full implementation would support ranges like ^1.0.0, ~1.0.0, etc.
    return version === range;
  }

  /**
   * Checks if two versions are compatible
   * @param version1 - The first version
   * @param version2 - The second version
   * @returns true if the versions are compatible, false otherwise
   */
  static isCompatible(version1: string, version2: string): boolean {
    // Simple implementation that considers versions compatible if they have the same major version
    // A full implementation might use more sophisticated compatibility rules
    try {
      const v1 = this.parse(version1);
      const v2 = this.parse(version2);
      return v1.major === v2.major;
    } catch (error) {
      return false;
    }
  }
}