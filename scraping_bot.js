require('dotenv').config();

const chalk = require('chalk');

const puppeteer = require('puppeteer-extra');

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')());

const get_user_data = async() => {

    console.log(chalk.yellowBright('API GET method...'));

    const browser = await puppeteer.launch({
        headless: true
    });
    const page = await browser.newPage();

    console.log(chalk.yellow('Browser launched...'));

    await page.goto(process.env.PRONOTE_LINK);
    await page.waitForSelector('input[type=text]');

    console.log(chalk.greenBright('On pronote...'));

    await login(page);

    const average = await get_user_average(page);

    const averages = {};
    averages['Moyennes Matières'] = await get_user_grades(page);

    await browser.close();

    const data = {...average, ...averages };

    return data;
};

const login = async(page) => {
    await page.type('input[type=text]', process.env.PRONOTE_USERNAME);
    await page.type('input[type=password]', process.env.PRONOTE_PASSWORD);

    await page.click('#id_39');

    console.log(chalk.greenBright(`Logged in with ${process.env.PRONOTE_USERNAME} account...`));
}

const get_user_average = async(page) => {
    console.log(chalk.yellowBright('Starting new process...'));

    await page.waitForSelector('#id_107id_64');
    await page.click('#id_107id_64');

    await page.waitForXPath('/html/body/div[4]/div[1]/div[2]/table/tbody/tr/td[1]/div/div/div[2]/div[1]/div[2]/div/div/div[1]/span/span');

    const user_average_element = await page.$x("/html/body/div[4]/div[1]/div[2]/table/tbody/tr/td[1]/div/div/div[2]/div[1]/div[2]/div/div/div[1]/span/span");
    let user_average = await page.evaluate(el => el.textContent, user_average_element[0]);

    let user_average_parsed = user_average.substring(0, user_average.length - 4);

    console.log(chalk.green(`Average retrieved from ${process.env.PRONOTE_USERNAME} (` + chalk.red.bold(`${user_average_parsed}/20`) + `)...`));

    let user_average_parsed_object = {};
    user_average_parsed_object['Moyenne Générale'] = user_average_parsed;

    console.log(chalk.yellow('End of process.'));

    return user_average_parsed_object;
}

const get_user_grades = async(page) => {
    console.log(chalk.yellowBright('Starting new process...'));

    await page.waitForXPath('/html/body/div[4]/div[1]/div[2]/table/tbody/tr/td[1]/div/div/div[2]/div[1]/div[1]/div[2]/div/div/table/tbody/tr[8]/td[2]/div/div/div/div/div/div[2]');

    const table_xpath = await page.$x('/html/body/div[4]/div[1]/div[2]/table/tbody/tr/td[1]/div/div/div[2]/div[1]/div[1]/div[2]/div/div/table');
    const number_of_rows = await page.evaluate(table => table.rows.length, table_xpath[0]);

    let subject_xpath = '';
    let subject = '';
    let subjects = [];
    let position = [];

    for (let i = 1; i <= number_of_rows; i++) {
        subject_xpath = await page.$x(`/html/body/div[4]/div[1]/div[2]/table/tbody/tr/td[1]/div/div/div[2]/div[1]/div[1]/div[2]/div/div/table/tbody/tr[${i}]/td[2]/div/div/div/div/div/div[2]`);
        subject = await page.evaluate(el => el.textContent, subject_xpath[0]);
        if (subject.includes('/') || subject.includes("Aujourd'hui")) {
            continue;
        } else {
            subjects.push(subject);
            position.push(i);
            i++;
        }
    }

    let subject_average_grade_xpath = '';
    let subject_average_grade = '';
    let subject_average_grades = [];

    for (let i = 1; i <= number_of_rows; i++) {
        subject_average_grade_xpath = await page.$x(`/html/body/div[4]/div[1]/div[2]/table/tbody/tr/td[1]/div/div/div[2]/div[1]/div[1]/div[2]/div/div/table/tbody/tr[${i}]/td[2]/div/div/div/div/div/div[1]`);
        try {
            subject_average_grade = await page.evaluate(el => el.textContent, subject_average_grade_xpath[0]);
        } catch (e) {
            continue;
        }

        if (position.includes(i)) {
            subject_average_grades.push(subject_average_grade);
        } else {
            continue;
        }
    }

    const subject_average_grades_object = {};

    subjects.forEach((key, i) => subject_average_grades_object[key] = subject_average_grades[i]);

    console.log(chalk.yellow('End of process.'));

    return subject_average_grades_object;
}



module.exports = get_user_data;