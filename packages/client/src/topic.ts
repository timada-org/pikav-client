const TOPIC_NAME_REGEX = /^(([^+#]*|\+)(\/([^+#]*|\+))*(\/#)?|#)$/;

export default class TopicFilter {
  filter: string;

  constructor(filter: string) {
    if (
      !filter.trim() ||
      new TextEncoder().encode(filter).length > 65535 ||
      !filter.match(TOPIC_NAME_REGEX)
    ) {
      throw new Error(`invalid topic filter (${filter})`);
    }

    this.filter = filter;
  }

  match(name: string): boolean {
    const tnIter = name.split("/");
    const ftIter = this.filter.split("/");

    const firstTn = tnIter.shift();
    const firstFt = ftIter.shift();

    if (firstTn?.startsWith("$")) {
      if (firstTn != firstFt) {
        return false;
      }
    } else {
      switch (firstFt) {
        case "#":
          return true;

        case "+":
          break;

        default:
          if (firstTn != firstFt) {
            return false;
          }
          break;
      }
    }

    while (true) {
      const ft = ftIter.shift();
      const tn = tnIter.shift();

      if (ft && tn) {
        if (ft === "#") {
          break;
        }
        if (ft === "+") {
          continue;
        }

        if (ft !== tn) {
          return false;
        }
      } else if (ft && !tn) {
        if (ft !== "#") {
          return false;
        }

        break;
      } else if (!ft && tn) {
        return false;
      } else if (!ft && !tn) {
        break;
      }
    }

    return true;
  }
}
