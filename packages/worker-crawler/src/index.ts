import { crawlVinted } from './crawlers/vinted'
import { crawlEbay } from './crawlers/ebay'
import { crawlGumtree } from './crawlers/gumtree'
import { crawlCraigslist } from './crawlers/craigslist'
import { crawlOfferup } from './crawlers/offerup'

export async function runCrawler(job: any) {
  const { marketplace, payload } = job.data

  switch (marketplace) {
    case 'vinted':
      return crawlVinted(payload)

    case 'ebay':
      return crawlEbay(payload)

    case 'gumtree':
      return crawlGumtree(payload)

    case 'craigslist':
      return crawlCraigslist(payload)

    case 'offerup':
      return crawlOfferup(payload)

    default:
      throw new Error(`Unsupported marketplace: ${marketplace}`)
  }
}
