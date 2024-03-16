import config from '../config.js';

export function getIDComponent() {

    // Configurations.
    const TIMEOUT_MS = 30000;
    const apiUrl = config.apiUrl;
    const apiPort = config.apiPort;
    
    if (!apiUrl || !apiPort) {
        console.error(`API configuration doesn't exists.`);
    }
    const apiEndpoint = `${config.apiUrl}:${apiPort}`;

    const root = document.getElementById('root');
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
    id_elem.innerHTML = 'ID';

    // Create ID value text div
    const id_value_elem = document.createElement('div');
    id_value_elem.id = 'elem-id-value';

    // Create getting ID button.
    const btn = document.createElement('button');
    btn.id = 'btn-get-id';
    btn.innerHTML = 'Get ID';

    /**
     * The function 'get_id' gets a username as an argument and using the API to get its ID.
     * It return its ID in case of a success, the error message in case of a failure, or the status code otherwise.
     */
    const get_id = async (username) => {
        try {
            const res = await axios.request({
                url: `${apiEndpoint}/getId`,
                methoc: 'get',
                params: {
                    username
                },
                timeout: TIMEOUT_MS
            });

            return res.data;
        } catch (err) {
            console.error('Error getting user ID:', err.response.data.message);
            return err.response.data.message;
        }
    }

    // Event listener for the 'Get ID' button.
    document.addEventListener('click', async event => {
        if (event.target && event.target.id === 'btn-get-id') {
            const get_id_res = await get_id(username_input.value);
            // In case of a success.
            if (get_id_res.id) {
                id_value_elem.innerHTML = `<span style="color: green;">${get_id_res.id}`;
            // In case of a failure.
            } else {
                id_value_elem.innerHTML = `<span style="color: red;">${get_id_res}`;
            }
        }
    })

    // Fragment element appends.
    fragment.appendChild(username_elem);
    fragment.appendChild(username_input);
    fragment.appendChild(id_elem);
    fragment.appendChild(id_value_elem);
    fragment.appendChild(btn);
    
    return root.appendChild(fragment);
}