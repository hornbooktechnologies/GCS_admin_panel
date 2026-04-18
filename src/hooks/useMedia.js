const useMedia = () => {
    const BASE_URL = "/assets";

    const getIconUrl = (name) => `${BASE_URL}/icons/${name}`;
    const getImageUrl = (name) => `${BASE_URL}/images/${name}`;

    return { getIconUrl, getImageUrl };
};

export default useMedia;
