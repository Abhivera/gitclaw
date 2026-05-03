import * as tar from 'tar'
import fs from 'fs'
import path from 'path'

export class CompressService {
  async compressRepo(repoPath: string, outputDir: string): Promise<string> {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const repoName = path.basename(repoPath)
    const parentName = path.basename(path.dirname(repoPath))
    const archiveName = `${parentName}__${repoName}.tar.gz`
    const tempPath = path.join(outputDir, `${archiveName}.tmp`)
    const finalPath = path.join(outputDir, archiveName)

    await tar.create(
      {
        gzip: true,
        file: tempPath,
        cwd: path.dirname(repoPath),
      },
      [repoName],
    )

    // Atomic rename
    fs.renameSync(tempPath, finalPath)
    return finalPath
  }

  getArchivePath(outputDir: string, owner: string, repoName: string): string {
    return path.join(outputDir, `${owner}__${repoName}.tar.gz`)
  }

  archiveExists(archivePath: string): boolean {
    return fs.existsSync(archivePath)
  }
}
