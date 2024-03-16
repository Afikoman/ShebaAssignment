import config from '../config.js';

export function signInComponent() {

    // Configurations.
    const TIMEOUT_MS = 30000;
    const apiUrl = config.apiUrl;
    const apiPort = config.apiPort;
    
    if (!apiUrl || !apiPort) {
        console.error(`API configuration doesn't exists.`);
    }
    const apiEndpoint = `${config.apiUrl}:${apiPort}`;

    const root = document.getElementById("root");
    const fragment = document.createDocumentFragment();

    // Create username text div.
    const username_elem = document.createElement('div');
    username_elem.id = 'elem-username';
    username_elem.innerHTML = 'username';

    // Create username text box.
    const username_input = document.createElement('input');
    username_input.id = 'username-input';
    username_input.type = 'text';

    // Create ID text div.
    const id_elem = document.createElement('div');
    id_elem.id = 'elem-id';
    id_elem.innerHTML = `ID`;

    // Create ID text box.
    const id_input = document.createElement('input');
    id_input.id = 'id-input';
    id_input.type = 'text';

    // Create sign in button.
    const btn = document.createElement('button');
    btn.id = 'btn-sign-in';
    btn.innerHTML = 'Sign in';

    // Create action result  text div.
    const action_res = document.createElement('div');
    action_res.id = 'elem-action-res';

    /**
     * The function 'create_user' gets a username and an id as arguments.
     * It's using the API to create the username and store it in the DB.
     */
    const create_user = async (username, id) => {
        try {
            const res = await axios.request({
                url: `${apiEndpoint}/createUser`,
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                    username,
                    id
                }),
                timeout: TIMEOUT_MS,
                validateStatus: function (status) {
                    return status >= 200 && status < 300 || status === 409; // Treat 409 as a success.
                }
            });

            if (res.status === 409) {
                console.error('Failed to create user, ID already exists.');
                action_res.innerHTML = `<span style="color: red;">Failed to create user, ID already exists.`;
            }else {
                console.log('User Created Successfully');
                action_res.innerHTML = `<span style="color: green;">User ${username} created successfully.`;
            }
        } catch (err) {
            console.error('Error in creating user.', err);
            action_res.innerHTML = `<span style="color: red;">Error in creating user.`;
        }
    }

    // Event listener for the 'Get ID' button.
    document.addEventListener("click", event => {
        if (event.target && event.target.id === 'btn-sign-in') {
            // console.log('sign in!')
            // console.log(username_input.value)
            // console.log(id_input.value)
            action_res.innerHTML = ''; // Reset action result text div.
            create_user(username_input.value, id_input.value);
        }
    })

    // Fragment element appends.
    fragment.appendChild(username_elem)
    fragment.appendChild(username_input)
    fragment.appendChild(id_elem)
    fragment.appendChild(id_input)
    fragment.appendChild(btn)
    fragment.appendChild(action_res);
    
    return root.appendChild(fragment);
}