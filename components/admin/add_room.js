// Импортируем React и useState из react hooks
import React, { useState } from 'react';

// Определяем компонент PersonForm
const PersonForm = () => {
    // useState инициализирует состояние компонента с пустым массивом форм
    const [forms, setForms] = useState([]);

    // Обработчик события нажатия кнопки "Добавить человека"
    const handleAddPerson = () => {
        // Копируем массив форм и добавляем новую пустую форму с уникальным id
        setForms([...forms, { name: '', surname: '', id: Date.now() }]);
    };

    // Обработчик изменения значения в поле ввода
    const handleInputChange = (e, index) => {
        // Получаем значение и имя поля ввода
        const { name, value } = e.target;
        // Копируем массив форм и обновляем значение поля ввода в соответствующей форме
        const newForms = [...forms];
        newForms[index][name] = value;
        // Обновляем состояние компонента с новым массивом форм
        setForms(newForms);
    };

    // Обработчик события нажатия кнопки "Удалить человека"
    const handleAdd = (index) => {
        // Копируем массив форм и удаляем форму по указанному индексу
        const newForms = [...forms];
        newForms.splice(index, 1);
        // Обновляем состояние компонента с новым массивом форм
        setForms(newForms);
    };

    // Возвращаем JSX, отображающий кнопку "Добавить человека" и все формы из массива форм
    return (
        <div>
            <button onClick={handleAddPerson}>Добавить человека</button>
            {forms.map((form, index) => (
                <div key={form.id}>
                    <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={(e) => handleInputChange(e, index)}
                        placeholder="Имя"
                    />
                    <input
                        type="text"
                        name="surname"
                        value={form.surname}
                        onChange={(e) => handleInputChange(e, index)}
                        placeholder="Фамилия"
                    />
                    <button onClick={() => handleAdd(index)}>Удалить человека</button>
                </div>
            ))}
        </div>
    );
};

// Экспортируем компонент PersonForm
export default PersonForm;