console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}
// // Step 2
// let navLink = $$("nav a")
// let currentLink = navLinks.find(
//     (a) => a.host === location.host && a.pathname === location.pathname
//   );
//   currentLink?.classList.add('current');

let pages = [
    { url: '', title: 'Home' },
    { url: 'https://github.com/vaidehi-karve', title: 'Github' },
    { url: 'projects/', title: 'Projects' },
    { url: 'resume/', title: 'Resume' },
    { url: 'meta/', title: 'Meta' },
    { url: 'contact/', title: 'Contact' },
  ];

let nav = document.createElement('nav');
document.body.prepend(nav); 
const ARE_WE_HOME = document.documentElement.classList.contains('home');

for (let p of pages) {
    let url = p.url;
    let title = p.title;
    // TODO create link and add it to nav
    if (!ARE_WE_HOME && !url.startsWith('http')) {
        url = '../' + url;
      }
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    nav.append(a);
    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
    }
    else if (a.host !== location.host) {
        a.target = "_blank";
    }
  }


document.body.insertAdjacentHTML(
    'afterbegin',
    `
      <label class="color-scheme">
          Theme:
          <select>
            <option value=""></option>
            <option value=lightdark>light dark</option>
            <option value=light>light</option>
            <option value=dark>dark</option>
          </select>
      </label>`
);

let select = document.querySelector(".color-scheme")

select.addEventListener('input', function (event) {
    console.log('color scheme changed to', event.target.value);
    document.documentElement.style.setProperty('color-scheme', event.target.value);
    localStorage.colorScheme = event.target.value;
  });

if ("colorScheme" in localStorage) {
    // ".color-scheme"===localStorage.colorScheme;
    document.documentElement.style.setProperty('color-scheme', localStorage.getItem('colorScheme'));
    select.value = localStorage.getItem('colorScheme');
}

// LAB 3 ends
// ----------------------------------------------------------------------------------------
// Lab 4 starts
export async function fetchJSON(url) {
  console.log('fetchJSON is running');
  try {
      // Fetch the JSON file from the given URL
      const response = await fetch(url);
      console.log(response);
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();
    console.log("second message");
    return data;

  } catch (error) {
      console.error('Error fetching or parsing JSON data:', error);
  } 
}

export function renderProjects(project, containerElement, headingLevel = 'h2') {
  // Your code will go here
  containerElement.innerHTML = '';
  for (var proj of project) {
    console.log(proj)
    const article = document.createElement('article');
    article.innerHTML = `
    <h3>${proj.title}</h3>
    <h4>${proj.year}</h4>
    <img src="${proj.image}" alt="${proj.title}">
    <p>${proj.description}</p>
    `;
    containerElement.appendChild(article);
  }
}

export async function fetchGitHubData(username) {
  // return statement here
  console.log("test for githubss")
  return fetchJSON(`https://api.github.com/users/${username}`);
}
