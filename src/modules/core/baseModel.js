class BaseModel {
    constructor(name, version) {
        this.name = name;
        this.version = version;
    }

    predict() {
        throw new Error("predict() must be implemented");
    }
}

module.exports = BaseModel;