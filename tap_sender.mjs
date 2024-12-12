import fetch from 'node-fetch';
import chalk from 'chalk';
import gradient from 'gradient-string';

class TapSender {
  constructor(tapURL, maxTaps) {
    this.tapURL = tapURL;
    this.maxTaps = maxTaps;
    this.currentTapCount = 0;
    this.running = true;
    this.phpsessid = null;
    this.jony_position =null;
  }

  // Set the PHPSESSID for requests
  setSessionId(sessionId) {
    this.phpsessid = sessionId;
  }

  setPosition(jony_position) {
    this.jony_position=jony_position;
  }

  // Send taps directly
  async sendTaps() {
    if (!this.phpsessid) {
      throw new Error('PHPSESSID is not set.');
    }

    try {
      const response = await fetch(`${this.tapURL}?taps=30`, {
        method: 'GET',
        headers: {
          Cookie: `PHPSESSID=${this.phpsessid}`,
          Referer: `https://muzbattle.ru/webapp/participant.php?type=1&id=1&place=${this.jony_position}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP Status: ${response.status}`);
      }

      const json = await response.json();

      if (json.code === 0) {
        this.currentTapCount += 30;
        console.log(
          chalk.green(
            `Success: Sent 30 taps. Total taps sent: ${this.currentTapCount}/${this.maxTaps}`
          )
        );
        return true;
      } else {
        console.log(chalk.red(`Failed: ${json.message || 'Unknown error'}`));
        return false;
      }
    } catch (error) {
      console.log(chalk.red(`Request failed: ${error.message}`));
      return false;
    }
  }

  // Start sending taps
  async start() {
    console.log(chalk.blue('Starting tap sending process...'));

    while (this.running && this.currentTapCount < this.maxTaps) {
      const success = await this.sendTaps();

      if (!success) {
        console.log(chalk.red('Pausing due to a failed request.'));
      }

      // Delay between requests to avoid overloading the server
      await new Promise(resolve => setTimeout(resolve, 30));
    }

    console.log(
      gradient.passion(
        `\nProcess completed. Total taps sent: ${this.currentTapCount}/${this.maxTaps}.`
      )
    );
  }

  // Stop the tapping process
  stop() {
    this.running = false;
    console.log(gradient.morning('Tap sending process stopped.'));
  }
}

export default TapSender;
