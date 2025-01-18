import { $$one, $$all, $$new } from './indolence.ts'
import 'bootstrap/dist/css/bootstrap.min.css'
import * as bootstrap from 'bootstrap'
import { Resume, Education, Career, License, isEducation, isCareer } from './models/Resume.ts'

export function addHistoryEventListener() {
    $$one('#add-career-history')!.addEventListener('click', () => {
        const historyContainer = $$one('#career-history')!;
        const newCard = $$new('div');
        newCard.className = 'card mt-2';
        newCard.innerHTML = `
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4">
                        <input type="month" class="form-control mb-2" name="endDate" placeholder="年月">
                    </div>
                    <div class="col-md-7 d-flex justify-content-between">
                        <input type="text" class="form-control" name="name" placeholder="内容を入力してください">
                    </div>
                    <div class="col-md-1 d-flex justify-content-between text-nowrap">
                        <button type="button" class="btn btn-danger ml-2 remove-history">削除</button>
                    </div>
                </div>
            </div>
        `;
        historyContainer.appendChild(newCard);

        newCard.querySelector('.remove-history')!.addEventListener('click', () => {
            historyContainer.removeChild(newCard);
        });
    });
};

export function addLicenseEventListener() {
    $$one('#add-license-history')!.addEventListener('click', () => {
        const careerContainer = $$one('#license-history')!;
        const newCard = $$new('div');
        newCard.className = 'card mt-2';
        newCard.innerHTML = `
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4">
                        <input type="month" class="form-control mb-2" name="endDate" placeholder="年月">
                    </div>
                    <div class="col-md-7 d-flex justify-content-between">
                        <input type="text" class="form-control" name="name" placeholder="内容を入力してください">
                    </div>
                    <div class="col-md-1 d-flex justify-content-between text-nowrap">
                        <button type="button" class="btn btn-danger ml-2 remove-history">削除</button>
                    </div>
                </div>
            </div>
        `;
        careerContainer.appendChild(newCard);

        newCard.querySelector('.remove-history')!.addEventListener('click', () => {
            careerContainer.removeChild(newCard);
        });
    });
}

export function initCreatedAt() {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const today = String(date.getDate()).padStart(2, '0')
    const elem = $$one<HTMLInputElement>('#created-at')
    elem!.value = `${year}-${month}-${today}`
}

export function saveToLocalStorage() {
    const inputs = $$all<HTMLInputElement>('input[type="text"], input[type="month"], input[type="date"]')!
    const data: { [key: string]: string } = {};

    for (const input of inputs) {
        if (!input.name) {
            continue;
        }
        data[input.name] = input.value;
    }

    localStorage.setItem('resume', JSON.stringify(data));
}

export function addInputEventListeners() {
    const inputs = $$all<HTMLInputElement>('input[type="text"], input[type="month"], input[type="date"]')!
    for (const input of inputs) {
        input.addEventListener('input', saveToLocalStorage)
    }
}

export function loadFromLocalStorage() {
    const data = localStorage.getItem('resume')
    if (!data) {
        return;
    }

    // 既存の学歴・職歴、免許・資格項目を削除
    const historyCards = $$all<HTMLElement>('div.card')!;
    for (const card of historyCards) {
        card.remove();
    }

    // const resume = Object.assign(new Resume(), JSON.parse(data)) as Resume
    const resume = JSON.parse(data)
    for (const key in resume) {
        if (key === 'resume') {
            for (const item in resume[key]) {
                if (item === 'education' || item === 'career' || item === 'license') {
                    loadHistory(resume[key][item])
                }
            }
        } else {
            const input = $$one<HTMLInputElement>(`[name="${key}"]`)
            if (input && key !== 'createdAt') {
                input.value = resume[key]
            }
        }
    }

    // 年齢を画面に表示
    const age = $$one<HTMLInputElement>('#age-display')
    age!.innerHTML = isNaN(resume.birthday) ? Resume.calculateAge(resume.birthday).toString() : '&emsp;'
}

function loadHistory(resume: Education[] | Career[] | License[]) {
    if (!resume) {
        return;
    }
    if (resume.length === 0) {
        return;
    }

    let historyContainer: HTMLElement;
    let button: HTMLInputElement;
    let getDate: Function
    if (isEducation(resume[0]) || isCareer(resume[0])) {
        historyContainer = $$one('#career-history')!;
        button = $$one<HTMLInputElement>('#add-career-history')!;
        getDate = (history: Education | Career) => history.endDate?.split('-').slice(0, 2).join('-')!
    } else {
        historyContainer = $$one('#license-history')!;
        button = $$one<HTMLInputElement>('#add-license-history')!;
        getDate = (history: License) => history.date.split('-').slice(0, 2).join('-')!
    }
    for (const history of resume) {
        button!.click()
        const newCard = historyContainer.lastElementChild!
        const endDate = newCard.querySelector<HTMLInputElement>('input[name="endDate"]')!
        const name = newCard.querySelector<HTMLInputElement>('input[name="name"]')!
        endDate.value = getDate(history)
        name.value = history.name;
    }
}

export function addDownloadButtonEventListener() {
    $$one('#backup-button')!.addEventListener('click', () => {
        const data = localStorage.getItem('resume');
        if (!data) {
            return;
        }

        // 今日の日付をYYYYMMDD形式で取得
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const today = String(date.getDate()).padStart(2, '0');
        // ファイル名を「履歴書_作成日.json」とする
        const fileName = `履歴書_${year}${month}${today}.json`;

        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = $$new<HTMLAnchorElement>('a');
        a.href = url;
        a.download = fileName;
        a.click();
    });
}

export function addDeleteConfirmButtonEventListener() {
    $$one('#delete-content')!.addEventListener('click', () => {
        const modal = new bootstrap.Modal($$one('#confirmDeleteModal')!);
        modal.show();

        $$one('#confirm-delete')!.addEventListener('click', () => {
            localStorage.removeItem('resume');
            const inputs = $$all<HTMLInputElement>('input[type="text"], input[type="month"], input[type="date"]')!;
            for (const input of inputs) {
                input.value = '';
            }
            const age = $$one<HTMLInputElement>('#age-display')
            age!.innerHTML = '&emsp;'

            const historyCards = $$all<HTMLElement>('div.card')!;
            for (const card of historyCards) {
                card.remove();
            }
            modal.hide();
        });
    });
}

export function addUploadButtonEventListener() {
    $$one('#upload-button')!.addEventListener('click', () => {
        const input = $$new<HTMLInputElement>('input')
        input.type = 'file'
        input.accept = 'application/json'
        input.addEventListener('change', (event) => {
            const file = (event.target as HTMLInputElement).files?.[0]
            if (!file) {
                return
            }

            const reader = new FileReader()
            reader.onload = (e) => {
                const content = e.target?.result as string
                const parsedContent = JSON.parse(content)
                const validData = Object.assign(new Resume(), parsedContent)
                validData.updateAge()

                localStorage.setItem('resume', JSON.stringify(validData));
                loadFromLocalStorage();

                // jsonのキーにマッチするinput要素に値をセット
                for (const key in parsedContent) {
                    const input = $$one<HTMLInputElement>(`[name="${key}"]`)
                    if (input && key !== 'createdAt') {
                        input.value = parsedContent[key]
                    }
                }
                
                // 年齢を画面に表示
                const age = $$one<HTMLInputElement>('#age-display')
                age!.innerHTML = !isNaN(validData.age) ? validData.age.toString() : '&emsp;'
            };
            reader.readAsText(file);
        });
        input.click();
    });
}